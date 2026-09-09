"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { useApp } from "@/components/providers/app-provider";
import { BigButton } from "@/components/BigButton";
import {
  isLanguagePath,
  isOnboardingEntryPath,
  resolveAppRoute,
  type FlowFloor,
} from "@/lib/onboarding/decide-route";
import { getOnboardingSnapshot } from "@/lib/storage/onboarding";
import { subscribeStore } from "@/lib/storage/store-events";

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

  useEffect(() => {
    return subscribeStore(() => setOnboardingTick((n) => n + 1));
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, authStatus, sessionUser, onboardingTick]);

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
      });
      if (next.redirect && next.redirect !== window.location.pathname) {
        router.replace(next.redirect);
      }
    }

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockPopState);

    let removeBack: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void import("@capacitor/app").then(({ App }) => {
        const sub = App.addListener("backButton", () => {
          // Swallow back — forward-only unless a UI button unlocks.
        });
        removeBack = () => {
          void sub.then((h) => h.remove());
        };
      });
    }

    return () => {
      window.removeEventListener("popstate", blockPopState);
      removeBack?.();
    };
  }, [pathname, authStatus, sessionUser, router]);

  if (
    pathname === "/install" ||
    pathname.startsWith("/install/") ||
    pathname === "/inbox" ||
    pathname.startsWith("/inbox/")
  ) {
    return <>{children}</>;
  }

  if (decision.sessionError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-4 text-center">
        <p className="text-2xl font-bold text-[#0B1F3A]">
          {strings.authErrorGeneric}
        </p>
        <BigButton tone="primary" onClick={() => window.location.reload()}>
          OK
        </BigButton>
      </div>
    );
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
