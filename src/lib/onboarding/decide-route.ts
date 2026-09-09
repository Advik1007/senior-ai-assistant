/**
 * SINGLE source of truth for UNK AI onboarding / auth redirects.
 * Forward-only: never auto-send users to an earlier stage.
 */

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "anonymous"
  | "error";

export type FlowFloor = "language" | "auth" | "setup" | "done";

export type RouteDecision = {
  allow: boolean;
  redirect: string | null;
  sessionError: boolean;
};

const LANGUAGE_PATH = "/start";
const AUTH_PATH = "/auth";
const HOME_PATH = "/home";

const AUTH_PREFIXES = [
  "/auth/login",
  "/auth/signup",
  "/auth/check-email",
  "/auth/verify",
  "/auth/device/",
];

const FLOOR_RANK: Record<FlowFloor, number> = {
  language: 0,
  auth: 1,
  setup: 2,
  done: 3,
};

export function isInstallPath(path: string): boolean {
  return path === "/install" || path.startsWith("/install/");
}

export function isInboxPath(path: string): boolean {
  return path === "/inbox" || path.startsWith("/inbox/");
}

export function isLanguagePath(path: string): boolean {
  return path === LANGUAGE_PATH || path === "/language" || path === "/start";
}

export function isMarketingPath(path: string): boolean {
  return (
    path === "/" ||
    path === "/download" ||
    path.startsWith("/download/") ||
    path === "/install" ||
    path.startsWith("/install/")
  );
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

function pathFloor(path: string): FlowFloor {
  if (isLanguagePath(path)) return "language";
  if (isAuthPath(path) || path === "/auth/setup-calls") return "auth";
  if (isSetupPath(path)) return "setup";
  return "done";
}

export type ResolveRouteInput = {
  pathname: string;
  authStatus: AuthStatus;
  languageChosen: boolean;
  setupWizardComplete: boolean;
  sessionSetupCompleted: boolean;
  setupStep: "contacts" | "routine" | "medicines" | "complete";
  flowFloor: FlowFloor;
};

/**
 * Forward-only resolver.
 * Going backward is only possible after an explicit button clears the floor
 * (e.g. Change language → flowFloor = language).
 */
export function resolveAppRoute(input: ResolveRouteInput): RouteDecision {
  const {
    pathname,
    authStatus,
    languageChosen,
    setupWizardComplete,
    sessionSetupCompleted,
    setupStep,
    flowFloor,
  } = input;

  // Public website + inbox — never force into the app onboarding flow.
  if (isMarketingPath(pathname) || isInboxPath(pathname)) {
    return { allow: true, redirect: null, sessionError: false };
  }

  if (pathname === "/language") {
    return { allow: false, redirect: LANGUAGE_PATH, sessionError: false };
  }

  const setupDone = sessionSetupCompleted || setupWizardComplete;
  const floor: FlowFloor = setupDone
    ? "done"
    : languageChosen && FLOOR_RANK[flowFloor] < FLOOR_RANK.auth
      ? "auth"
      : flowFloor;

  // Hard lock: never open a screen behind the floor (except install).
  const attempted = pathFloor(pathname);
  if (FLOOR_RANK[attempted] < FLOOR_RANK[floor]) {
    if (floor === "done") {
      return { allow: false, redirect: HOME_PATH, sessionError: false };
    }
    if (floor === "setup") {
      return {
        allow: false,
        redirect: setupPathForStep(setupStep || "contacts"),
        sessionError: false,
      };
    }
    if (floor === "auth") {
      return { allow: false, redirect: AUTH_PATH, sessionError: false };
    }
  }

  if (authStatus === "loading") {
    if (floor !== "language" && isLanguagePath(pathname)) {
      return { allow: false, redirect: AUTH_PATH, sessionError: false };
    }
    if (floor === "language" && !isLanguagePath(pathname)) {
      return { allow: false, redirect: LANGUAGE_PATH, sessionError: false };
    }
    return { allow: true, redirect: null, sessionError: false };
  }

  if (authStatus === "error") {
    if (floor === "language" && !isLanguagePath(pathname)) {
      return { allow: false, redirect: LANGUAGE_PATH, sessionError: false };
    }
    if (floor !== "language" && isLanguagePath(pathname)) {
      return { allow: false, redirect: AUTH_PATH, sessionError: false };
    }
    return { allow: true, redirect: null, sessionError: true };
  }

  if (authStatus === "authenticated") {
    if (setupDone || floor === "done") {
      if (isOnboardingEntryPath(pathname)) {
        return { allow: false, redirect: HOME_PATH, sessionError: false };
      }
      return { allow: true, redirect: null, sessionError: false };
    }

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
      // Forward-only inside setup — cannot open an earlier step.
      if (pathIndex !== expectedIndex) {
        return { allow: false, redirect: expected, sessionError: false };
      }
    }

    return { allow: true, redirect: null, sessionError: false };
  }

  // Anonymous — stay on auth screens; never yank setup/home mid-login.
  // Only bounce non-auth routes to Welcome (/auth), and never while loading.
  if (floor === "language" || !languageChosen) {
    if (isLanguagePath(pathname)) {
      return { allow: true, redirect: null, sessionError: false };
    }
    return { allow: false, redirect: LANGUAGE_PATH, sessionError: false };
  }

  if (isLanguagePath(pathname)) {
    return { allow: false, redirect: AUTH_PATH, sessionError: false };
  }

  if (isAuthPath(pathname)) {
    return { allow: true, redirect: null, sessionError: false };
  }

  // Setup/home without a resolved session: send to login (not Welcome),
  // so a transient anonymous blip does not look like a full restart.
  if (isSetupPath(pathname) || pathname === HOME_PATH || pathname.startsWith("/home")) {
    return { allow: false, redirect: "/auth/login", sessionError: false };
  }

  return { allow: false, redirect: AUTH_PATH, sessionError: false };
}
