"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import {
  getOnboardingSnapshot,
  isOnboardingFinished,
  setupPathForStep,
  type SetupStep,
} from "@/lib/storage/onboarding";

const AUTH_PREFIXES = [
  "/auth/login",
  "/auth/signup",
  "/auth/check-email",
  "/auth/verify",
  "/auth/device/",
];

const SETUP_STEPS: SetupStep[] = ["contacts", "routine", "medicines", "complete"];

const LANGUAGE_PATH = "/";

function isAuthPath(path: string): boolean {
  return AUTH_PREFIXES.some((p) => path === p || path.startsWith(p));
}

function isSetupPath(path: string): boolean {
  return path.startsWith("/setup/");
}

function setupStepFromPath(path: string): SetupStep | null {
  const step = path.replace("/setup/", "") as SetupStep;
  return SETUP_STEPS.includes(step) ? step : null;
}

/**
 * HARD ORDER — never skip a step:
 * 1. Language (/) — user must tap a language; nothing else is allowed before this
 * 2. Login / verify (/auth/*)
 * 3. Setup wizard (/setup/contacts → routine → medicines → complete)
 * 4. Home (/home)
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authStatus, strings } = useApp();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const state = getOnboardingSnapshot();

    if (pathname === "/language") {
      router.replace(LANGUAGE_PATH);
      return;
    }

    // ── Step 1: Language ALWAYS first (no auth check, no session bypass) ──
    if (!state.languageChosen) {
      setAllowed(pathname === LANGUAGE_PATH);
      if (pathname !== LANGUAGE_PATH) router.replace(LANGUAGE_PATH);
      return;
    }

    // Steps 2–4 need server session status
    if (!ready) return;

    // Fully done → home only
    if (isOnboardingFinished(state)) {
      if (
        pathname === LANGUAGE_PATH ||
        isAuthPath(pathname) ||
        isSetupPath(pathname) ||
        pathname === "/auth/setup-calls"
      ) {
        setAllowed(false);
        router.replace("/home");
        return;
      }
      setAllowed(true);
      return;
    }

    // ── Step 2: Login / verify ──
    if (authStatus !== "authenticated") {
      const onAuth = isAuthPath(pathname);
      setAllowed(onAuth);
      if (!onAuth) router.replace("/auth/login");
      return;
    }

    // ── Step 3: Setup wizard ──
    if (pathname === "/auth/setup-calls") {
      setAllowed(false);
      router.replace("/setup/contacts");
      return;
    }

    const expectedStep = state.setupStep || "contacts";
    const expected = setupPathForStep(expectedStep);
    const pathStep = setupStepFromPath(pathname);

    if (!isSetupPath(pathname)) {
      setAllowed(false);
      router.replace(expected);
      return;
    }

    if (pathStep) {
      const pathIndex = SETUP_STEPS.indexOf(pathStep);
      const expectedIndex = SETUP_STEPS.indexOf(expectedStep);
      if (pathIndex > expectedIndex) {
        setAllowed(false);
        router.replace(expected);
        return;
      }
    }

    setAllowed(true);
  }, [pathname, router, ready, authStatus]);

  const languagePending =
    typeof window !== "undefined" &&
    !getOnboardingSnapshot().languageChosen;

  // Language screen never waits on auth bootstrap
  if (languagePending && pathname === LANGUAGE_PATH && allowed) {
    return <>{children}</>;
  }

  if (!ready || !allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center text-xl font-semibold text-[#0B1F3A]">
        {strings.loading}
      </div>
    );
  }

  return <>{children}</>;
}
