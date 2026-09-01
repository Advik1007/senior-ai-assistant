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

function isFullyReady(state: ReturnType<typeof getOnboardingSnapshot>): boolean {
  return isOnboardingFinished(state);
}

/**
 * Enforced order:
 * Language (/) → Login/Verify → /setup/contacts → /setup/routine
 * → /setup/medicines → /setup/complete → /home
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authStatus, strings } = useApp();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!ready) return;

    const state = getOnboardingSnapshot();

    if (pathname === "/language") {
      router.replace("/");
      return;
    }

    // 1) Language first
    if (!state.languageChosen) {
      setAllowed(pathname === "/");
      if (pathname !== "/") router.replace("/");
      return;
    }

    // Fully done → home (never show setup/login again)
    if (isFullyReady(state)) {
      if (
        pathname === "/" ||
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

    // 2) Login / verify — require a valid server session
    if (authStatus !== "authenticated") {
      const onAuth = isAuthPath(pathname);
      setAllowed(onAuth);
      if (!onAuth) router.replace("/auth/login");
      return;
    }

    // 3) Setup wizard (contacts → routine → medicines → complete)
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

  if (!ready || !allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center text-xl font-semibold text-[#0B1F3A]">
        {strings.loading}
      </div>
    );
  }

  return <>{children}</>;
}
