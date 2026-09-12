"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import {
  isLanguagePath,
  isOnboardingEntryPath,
  type FlowFloor,
} from "@/lib/onboarding/decide-route";
import { getOnboardingSnapshot } from "@/lib/storage/onboarding";

function lockOnboardingBack(pathname: string): boolean {
  const state = getOnboardingSnapshot();
  const floor = (state.flowFloor || "language") as FlowFloor;
  const onLockedScreen =
    isLanguagePath(pathname) || isOnboardingEntryPath(pathname);
  return (
    onLockedScreen &&
    (floor === "auth" ||
      floor === "setup" ||
      floor === "done" ||
      (state.languageChosen && isLanguagePath(pathname)))
  );
}

/**
 * Android Back must stay inside the Next.js app.
 * WebView history.back() reloads the remote page and shows “couldn’t be loaded”.
 */
export function NativeBackHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;

    void import("@capacitor/app").then(({ App }) => {
      const sub = App.addListener("backButton", () => {
        const path = window.location.pathname;
        if (lockOnboardingBack(path)) return;
        if (path === "/home" || path === "/") {
          void App.minimizeApp();
          return;
        }
        router.push("/home");
      });
      remove = () => {
        void sub.then((h) => h.remove());
      };
    });

    return () => remove?.();
  }, [pathname, router]);

  return null;
}
