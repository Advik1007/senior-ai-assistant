/**
 * SINGLE source of truth for UNK AI onboarding / auth redirects.
 * OnboardingGate must use this — no other component should invent redirects.
 */

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "anonymous"
  | "error";

export type RouteDecision = {
  allow: boolean;
  redirect: string | null;
  /** Temporary auth outage — do NOT treat as new user / language screen. */
  sessionError: boolean;
};

const LANGUAGE_PATH = "/";
const AUTH_PATH = "/auth";
const HOME_PATH = "/home";

const AUTH_PREFIXES = [
  "/auth/login",
  "/auth/signup",
  "/auth/check-email",
  "/auth/verify",
  "/auth/device/",
];

export function isInstallPath(path: string): boolean {
  return path === "/install" || path.startsWith("/install/");
}

export function isLanguagePath(path: string): boolean {
  return path === LANGUAGE_PATH || path === "/language";
}

export function isAuthPath(path: string): boolean {
  if (path === "/auth" || path === "/auth/") return true;
  return AUTH_PREFIXES.some((p) => path === p || path.startsWith(p));
}

export function isSetupPath(path: string): boolean {
  return path.startsWith("/setup/");
}

export function isOnboardingEntryPath(path: string): boolean {
  return (
    isLanguagePath(path) ||
    isAuthPath(path) ||
    isSetupPath(path) ||
    path === "/auth/setup-calls"
  );
}

export function setupPathForStep(
  step: "contacts" | "routine" | "medicines" | "complete",
): string {
  return `/setup/${step}`;
}

export type ResolveRouteInput = {
  pathname: string;
  authStatus: AuthStatus;
  /** Local device flag — may be missing after storage clear. */
  languageChosen: boolean;
  /** Local device flag. */
  setupWizardComplete: boolean;
  /** Server/session flag — authoritative when authenticated. */
  sessionSetupCompleted: boolean;
  setupStep: "contacts" | "routine" | "medicines" | "complete";
};

/**
 * Deterministic route resolver.
 *
 * Authenticated users NEVER go to Language Selection.
 * Temporary auth errors NEVER look like "new user".
 */
export function resolveAppRoute(input: ResolveRouteInput): RouteDecision {
  const {
    pathname,
    authStatus,
    languageChosen,
    setupWizardComplete,
    sessionSetupCompleted,
    setupStep,
  } = input;

  if (isInstallPath(pathname)) {
    return { allow: true, redirect: null, sessionError: false };
  }

  if (pathname === "/language") {
    return { allow: false, redirect: LANGUAGE_PATH, sessionError: false };
  }

  // Wait for session bootstrap — keep current screen, no bounce.
  if (authStatus === "loading") {
    return { allow: true, redirect: null, sessionError: false };
  }

  // Auth service blip — never send to Language as if new.
  if (authStatus === "error") {
    return { allow: true, redirect: null, sessionError: true };
  }

  const setupDone = sessionSetupCompleted || setupWizardComplete;

  // ── Authenticated ──
  if (authStatus === "authenticated") {
    if (setupDone) {
      if (isOnboardingEntryPath(pathname)) {
        return { allow: false, redirect: HOME_PATH, sessionError: false };
      }
      return { allow: true, redirect: null, sessionError: false };
    }

    // Setup incomplete — resume wizard. Never Language.
    if (pathname === "/auth/setup-calls") {
      return {
        allow: false,
        redirect: setupPathForStep("contacts"),
        sessionError: false,
      };
    }

    const expected = setupPathForStep(setupStep || "contacts");
    if (!isSetupPath(pathname)) {
      return { allow: false, redirect: expected, sessionError: false };
    }

    const steps = ["contacts", "routine", "medicines", "complete"] as const;
    const pathStep = pathname.replace("/setup/", "") as (typeof steps)[number];
    if (steps.includes(pathStep)) {
      const pathIndex = steps.indexOf(pathStep);
      const expectedIndex = steps.indexOf(setupStep || "contacts");
      if (pathIndex > expectedIndex) {
        return { allow: false, redirect: expected, sessionError: false };
      }
    }

    return { allow: true, redirect: null, sessionError: false };
  }

  // ── Anonymous (logged out) ──
  // Language only for true first-time devices.
  if (!languageChosen) {
    if (isLanguagePath(pathname)) {
      return { allow: true, redirect: null, sessionError: false };
    }
    return { allow: false, redirect: LANGUAGE_PATH, sessionError: false };
  }

  // Language already chosen → Login/Signup only (logout lands here).
  if (isAuthPath(pathname)) {
    return { allow: true, redirect: null, sessionError: false };
  }

  return { allow: false, redirect: AUTH_PATH, sessionError: false };
}
