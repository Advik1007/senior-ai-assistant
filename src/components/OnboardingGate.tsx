"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { BigButton } from "@/components/BigButton";
import { resolveAppRoute } from "@/lib/onboarding/decide-route";
import { getOnboardingSnapshot } from "@/lib/storage/onboarding";
import { subscribeStore } from "@/lib/storage/store-events";

/**
 * ONE authoritative redirect strategy for Language → Auth → Setup → Home.
 * No other screen should independently invent onboarding redirects.
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
    });
    // onboardingTick forces recompute after local onboarding writes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, authStatus, sessionUser, onboardingTick]);

  useLayoutEffect(() => {
    if (decision.allow) setEntered(true);
  }, [decision.allow]);

  useEffect(() => {
    if (!decision.redirect) return;
    // Prefer hard navigation for onboarding hops to avoid soft-nav loops.
    if (
      decision.redirect === "/" ||
      decision.redirect === "/auth" ||
      decision.redirect === "/home"
    ) {
      if (window.location.pathname !== decision.redirect) {
        window.location.replace(decision.redirect);
      }
      return;
    }
    router.replace(decision.redirect);
  }, [decision.redirect, router]);

  if (pathname === "/install" || pathname.startsWith("/install/")) {
    return <>{children}</>;
  }

  if (decision.sessionError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-4 text-center">
        <p className="text-2xl font-bold text-[#0B1F3A]">
          {strings.authErrorGeneric}
        </p>
        <p className="text-lg text-[#0B1F3A]/80">{strings.loading}</p>
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
