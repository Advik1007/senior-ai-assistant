"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
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
  if (path === "/auth" || path === "/auth/") return true;
  return AUTH_PREFIXES.some((p) => path === p || path.startsWith(p));
}

function isSetupPath(path: string): boolean {
  return path.startsWith("/setup/");
}

function setupStepFromPath(path: string): SetupStep | null {
  const step = path.replace("/setup/", "") as SetupStep;
  return SETUP_STEPS.includes(step) ? step : null;
}

function isInstallPath(path: string): boolean {
  return path === "/install" || path.startsWith("/install/");
}

type GateDecision = {
  allowed: boolean;
  redirect: string | null;
  /** Waiting on first session check — only then show full-screen Loading. */
  waiting: boolean;
};

function decide(
  pathname: string,
  ready: boolean,
  authStatus: "loading" | "authenticated" | "anonymous",
): GateDecision {
  if (isInstallPath(pathname)) {
    return { allowed: true, redirect: null, waiting: false };
  }

  if (pathname === "/language") {
    return { allowed: false, redirect: LANGUAGE_PATH, waiting: false };
  }

  const state = getOnboardingSnapshot();

  // Step 1: language
  if (!state.languageChosen) {
    const onLanguage = pathname === LANGUAGE_PATH;
    return {
      allowed: onLanguage,
      redirect: onLanguage ? null : LANGUAGE_PATH,
      waiting: false,
    };
  }

  // Keep showing the current screen while session restores — never flash Loading on scroll/nav.
  if (!ready) {
    return { allowed: true, redirect: null, waiting: false };
  }

  // Fully done → app screens only
  if (isOnboardingFinished(state)) {
    if (
      pathname === LANGUAGE_PATH ||
      isAuthPath(pathname) ||
      isSetupPath(pathname) ||
      pathname === "/auth/setup-calls"
    ) {
      return { allowed: false, redirect: "/home", waiting: false };
    }
    return { allowed: true, redirect: null, waiting: false };
  }

  // Step 2: auth
  if (authStatus !== "authenticated") {
    const onAuth = isAuthPath(pathname);
    return {
      allowed: onAuth,
      redirect: onAuth ? null : "/auth",
      waiting: false,
    };
  }

  // Step 3: setup wizard
  if (pathname === "/auth/setup-calls") {
    return { allowed: false, redirect: "/setup/contacts", waiting: false };
  }

  const expectedStep = state.setupStep || "contacts";
  const expected = setupPathForStep(expectedStep);
  const pathStep = setupStepFromPath(pathname);

  if (!isSetupPath(pathname)) {
    return { allowed: false, redirect: expected, waiting: false };
  }

  if (pathStep) {
    const pathIndex = SETUP_STEPS.indexOf(pathStep);
    const expectedIndex = SETUP_STEPS.indexOf(expectedStep);
    if (pathIndex > expectedIndex) {
      return { allowed: false, redirect: expected, waiting: false };
    }
  }

  return { allowed: true, redirect: null, waiting: false };
}

/**
 * HARD ORDER — never skip a step:
 * 1. Language (/)
 * 2. Sign in or Create account
 * 3. Setup wizard
 * 4. Home
 *
 * Once the user has entered the app, we keep the UI mounted so scroll/nav
 * never flashes the full-screen “Loading…” screen.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authStatus, strings } = useApp();
  const [entered, setEntered] = useState(false);

  const decision = useMemo(
    () => decide(pathname, ready, authStatus),
    [pathname, ready, authStatus],
  );

  useLayoutEffect(() => {
    if (decision.allowed) setEntered(true);
  }, [decision.allowed]);

  useEffect(() => {
    if (decision.redirect) router.replace(decision.redirect);
  }, [decision.redirect, router]);

  // Public install — never gated
  if (isInstallPath(pathname)) {
    return <>{children}</>;
  }

  // Cold start only: no screen yet and decision blocks content
  if (!decision.allowed && !entered) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center text-xl font-semibold text-[#0B1F3A]">
        {strings.loading}
      </div>
    );
  }

  // Redirect in progress after user already saw the app — keep UI (smooth).
  return <>{children}</>;
}
