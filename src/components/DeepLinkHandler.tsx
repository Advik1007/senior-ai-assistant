"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { pathFromDeepLinkUrl } from "@/lib/deep-link";

/**
 * When the safety-check email opens the app via ai.unk.app://…,
 * navigate the WebView to the matching /auth/verify (or device) route.
 */
export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;

    void import("@capacitor/app").then(({ App }) => {
      const sub = App.addListener("appUrlOpen", (event) => {
        const path = pathFromDeepLinkUrl(event.url);
        if (path) {
          router.replace(path);
        }
      });
      remove = () => {
        void sub.then((h) => h.remove());
      };

      // Cold start from a deep link (Android may deliver URL after launch).
      void App.getLaunchUrl()
        .then((result) => {
          const path = result?.url ? pathFromDeepLinkUrl(result.url) : null;
          if (path) router.replace(path);
        })
        .catch(() => undefined);
    });

    return () => remove?.();
  }, [router]);

  return null;
}
