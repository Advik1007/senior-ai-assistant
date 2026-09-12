"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { useApp } from "@/components/providers/app-provider";
import {
  isLanguagePath,
  isOnboardingEntryPath,
  resolveAppRoute,
  type FlowFloor,
} from "@/lib/onboarding/decide-route";
import { getOnboardingSnapshot } from "@/lib/storage/onboarding";
import { subscribeStore } from "@/lib/storage/store-events";

function isNativeAppShell(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // ignore
  }
  const win = window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
    androidBridge?: unknown;
  };
  return Boolean(win.androidBridge || win.Capacitor?.isNativePlatform?.());
}

/**
 * Forward-only onboarding lock.
 * Android/system Back cannot return to Language/Welcome/earlier setup
 * unless the user taps an explicit button (e.g. Change language).
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus, sessionUser, strings } = useApp();
  const [entered, setEntered] = useState(false);
  const [onboardingTick, setOnboardingTick] = useState(0);
  const nativeApp = isNativeAppShell();

  useEffect(() => {
    let last = JSON.stringify(getOnboardingSnapshot());
    return subscribeStore(() => {
      const next = JSON.stringify(getOnboardingSnapshot());
      if (next === last) return;
      last = next;
      setOnboardingTick((n) => n + 1);
    });
  }, []);

  const decision = useMemo(() => {
    const state = getOnboardingSnapshot();
    return resolveAppRoute({
      pathname,
      authStatus,
      languageChosen: state.languageChosen,
      setupWizardComplete: state.setupWizardComplete,
      sessionSetupCompleted: Boolean(sessionUser?.setupCompleted),
      setupStep: state.setupStep || "contacts",
      flowFloor: (state.flowFloor || "language") as FlowFloor,
      nativeApp,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, authStatus, sessionUser, onboardingTick, nativeApp]);

  useLayoutEffect(() => {
    if (decision.allow) setEntered(true);
  }, [decision.allow]);

  useEffect(() => {
    if (!decision.redirect) return;
    if (window.location.pathname === decision.redirect) return;
    // Soft client nav — avoid full WebView reload (was the biggest hop lag).
    router.replace(decision.redirect);
  }, [decision.redirect, router]);

  // Block hardware / gesture Back on onboarding screens (forward-only).
  // Do NOT re-run on store ticks — pushState mid-session fights WebView scroll.
  useEffect(() => {
    const state = getOnboardingSnapshot();
    const floor = state.flowFloor || "language";
    const onLockedScreen =
      isLanguagePath(pathname) || isOnboardingEntryPath(pathname);
    const lockBack =
      onLockedScreen &&
      (floor === "auth" ||
        floor === "setup" ||
        floor === "done" ||
        (state.languageChosen && isLanguagePath(pathname)));

    if (!lockBack) return;

    function blockPopState() {
      window.history.pushState(null, "", window.location.href);
      const latest = getOnboardingSnapshot();
      const next = resolveAppRoute({
        pathname: window.location.pathname,
        authStatus,
        languageChosen: latest.languageChosen,
        setupWizardComplete: latest.setupWizardComplete,
        sessionSetupCompleted: Boolean(sessionUser?.setupCompleted),
        setupStep: latest.setupStep || "contacts",
        flowFloor: (latest.flowFloor || "language") as FlowFloor,
        nativeApp: isNativeAppShell(),
      });
      if (next.redirect && next.redirect !== window.location.pathname) {
        router.replace(next.redirect);
      }
    }

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockPopState);

    return () => {
      window.removeEventListener("popstate", blockPopState);
    };
  }, [pathname, authStatus, sessionUser, router]);

  // Public website + inbox bypass the app gate entirely.
  // Exception: native APK boots at `/` and must enter the real app flow.
  if (
    (pathname === "/" && !nativeApp) ||
    pathname === "/download" ||
    pathname.startsWith("/download/") ||
    pathname === "/install" ||
    pathname.startsWith("/install/") ||
    pathname === "/inbox" ||
    pathname.startsWith("/inbox/")
  ) {
    return <>{children}</>;
  }

  if (!decision.allow && !entered) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center text-xl font-semibold text-[#0B1F3A]">
        {strings.loading}
      </div>
    );
  }

  return <>{children}</>;
}
