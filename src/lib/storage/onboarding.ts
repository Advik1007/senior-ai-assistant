import { readJson, writeJson } from "@/lib/storage/local-store";
import { emitStore } from "@/lib/storage/store-events";

const PERSIST_KEY = "unk.onboarding";
const LANG_COOKIE = "unk_lang_chosen";
const LEGACY_SESSION_LANGUAGE_KEY = "unk.session.languageChosen";

export type SetupStep = "contacts" | "routine" | "medicines" | "complete";

/** How far the user has progressed — never auto-go behind this. */
export type FlowFloor = "language" | "auth" | "setup" | "done";

export type OnboardingState = {
  languageChosen: boolean;
  emailVerified: boolean;
  /** @deprecated kept for migration; use setupWizardComplete */
  setupComplete: boolean;
  /** True only after finishing /setup/complete (party popper screen). */
  setupWizardComplete: boolean;
  setupStep: SetupStep;
  /** Lowest stage the user has reached; back navigation cannot go below this. */
  flowFloor: FlowFloor;
};

const DEFAULT: OnboardingState = {
  languageChosen: false,
  emailVerified: false,
  setupComplete: false,
  setupWizardComplete: false,
  setupStep: "contacts",
  flowFloor: "language",
};

const FLOOR_RANK: Record<FlowFloor, number> = {
  language: 0,
  auth: 1,
  setup: 2,
  done: 3,
};

let cache: OnboardingState | null = null;

type PersistedOnboarding = Partial<{
  languageChosen: boolean;
  emailVerified: boolean;
  callsSetup: boolean;
  setupComplete: boolean;
  setupWizardComplete: boolean;
  setupStep: SetupStep;
  flowFloor: FlowFloor;
}>;

function clearLegacyLanguageFlag(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(LEGACY_SESSION_LANGUAGE_KEY);
}

function readLangCookie(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.cookie.split(";").some((part) => {
      const [key, value] = part.trim().split("=");
      return key === LANG_COOKIE && value === "1";
    });
  } catch {
    return false;
  }
}

function writeLangCookie(chosen: boolean): void {
  if (typeof document === "undefined") return;
  try {
    const maxAge = chosen ? 60 * 60 * 24 * 365 * 2 : 0;
    const secure =
      typeof location !== "undefined" && location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `${LANG_COOKIE}=${chosen ? "1" : ""}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    // ignore
  }
}

function readPersisted(): PersistedOnboarding {
  return readJson<PersistedOnboarding>(PERSIST_KEY, {});
}

function normalizeFloor(
  floor: FlowFloor | undefined,
  languageChosen: boolean,
  setupWizardComplete: boolean,
): FlowFloor {
  if (setupWizardComplete) return "done";
  if (floor === "language" || floor === "auth" || floor === "setup" || floor === "done") {
    if (languageChosen && FLOOR_RANK[floor] < FLOOR_RANK.auth) return "auth";
    return floor;
  }
  if (languageChosen) return "auth";
  return "language";
}

function buildState(persisted: PersistedOnboarding): OnboardingState {
  const fromStorage = !!persisted.languageChosen;
  const fromCookie = readLangCookie();
  const languageChosen = fromStorage || fromCookie;

  if (languageChosen && !fromStorage) {
    try {
      writeJson(PERSIST_KEY, { ...persisted, languageChosen: true });
    } catch {
      // ignore
    }
  }
  if (languageChosen && !fromCookie) writeLangCookie(true);

  const setupWizardComplete = !!persisted.setupWizardComplete;

  return {
    languageChosen,
    emailVerified: !!persisted.emailVerified,
    setupComplete: !!persisted.setupComplete,
    setupWizardComplete,
    setupStep: persisted.setupStep ?? "contacts",
    flowFloor: normalizeFloor(
      persisted.flowFloor,
      languageChosen,
      setupWizardComplete,
    ),
  };
}

export function getOnboardingSnapshot(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT;
  if (!cache) {
    clearLegacyLanguageFlag();
    cache = buildState(readPersisted());
  }
  return cache;
}

export function refreshOnboardingSnapshot(): OnboardingState {
  cache = null;
  return getOnboardingSnapshot();
}

export function saveOnboarding(state: OnboardingState): void {
  cache = state;
  writeLangCookie(state.languageChosen);
  writeJson(PERSIST_KEY, {
    languageChosen: state.languageChosen,
    emailVerified: state.emailVerified,
    setupComplete: state.setupComplete,
    setupWizardComplete: state.setupWizardComplete,
    setupStep: state.setupStep,
    flowFloor: state.flowFloor,
  });
  emitStore();
  void import("@/lib/storage/native-onboarding")
    .then(({ persistOnboardingToNative }) => persistOnboardingToNative(state))
    .catch(() => undefined);
}

function raiseFloor(state: OnboardingState, floor: FlowFloor): OnboardingState {
  if (FLOOR_RANK[floor] <= FLOOR_RANK[state.flowFloor]) return state;
  return { ...state, flowFloor: floor };
}

/** Language picked — lock past Language unless Change language is pressed. */
export function markLanguageChosen(): void {
  const current = getOnboardingSnapshot();
  saveOnboarding(
    raiseFloor({ ...current, languageChosen: true }, "auth"),
  );
}

/**
 * ONLY call from an explicit "Change language" button.
 * This is the sole intentional unlock back to Language Selection.
 */
export function clearLanguageChoice(): void {
  saveOnboarding({
    ...getOnboardingSnapshot(),
    languageChosen: false,
    flowFloor: "language",
  });
}

export function markEmailVerified(): void {
  const current = getOnboardingSnapshot();
  saveOnboarding({
    ...current,
    emailVerified: true,
    setupStep: current.setupWizardComplete ? current.setupStep : "contacts",
    setupComplete: current.setupComplete,
    setupWizardComplete: current.setupWizardComplete,
  });
}

/** Advance setup — never moves the floor backward. */
export function markSetupStep(step: SetupStep): void {
  const current = getOnboardingSnapshot();
  const steps: SetupStep[] = ["contacts", "routine", "medicines", "complete"];
  const nextIndex = steps.indexOf(step);
  const curIndex = steps.indexOf(current.setupStep);
  const setupStep = nextIndex >= curIndex ? step : current.setupStep;
  saveOnboarding(
    raiseFloor(
      {
        ...current,
        setupStep,
        setupComplete: false,
        setupWizardComplete: false,
      },
      "setup",
    ),
  );
}

export function markSetupComplete(): void {
  saveOnboarding({
    ...getOnboardingSnapshot(),
    setupComplete: true,
    setupWizardComplete: true,
    setupStep: "complete",
    flowFloor: "done",
  });
}

/** Call after successful login/signup — lock into setup (or done). */
export function markEnteredAuthFlow(): void {
  const current = getOnboardingSnapshot();
  if (current.setupWizardComplete) {
    saveOnboarding({ ...current, flowFloor: "done", languageChosen: true });
    return;
  }
  saveOnboarding(raiseFloor({ ...current, languageChosen: true }, "auth"));
}

export function markEnteredSetupFlow(): void {
  const current = getOnboardingSnapshot();
  saveOnboarding(raiseFloor({ ...current, languageChosen: true }, "setup"));
}

/**
 * Align local wizard flags with the account after login/signup/verify.
 * Server setup_completed wins — a stale local "setup done" must not skip setup.
 */
export function syncSetupFromAccount(setupCompleted: boolean): string {
  const current = getOnboardingSnapshot();
  if (setupCompleted) {
    markSetupComplete();
    return "/home";
  }

  // Account still needs setup. Clear a false local "done" so the gate
  // cannot bounce /setup → /home.
  const step: SetupStep =
    current.setupWizardComplete || current.flowFloor === "done"
      ? "contacts"
      : current.setupStep || "contacts";

  saveOnboarding({
    ...current,
    languageChosen: true,
    emailVerified: true,
    setupComplete: false,
    setupWizardComplete: false,
    setupStep: step,
    flowFloor: "setup",
  });
  return setupPathForStep(step);
}

export function markCallsSetup(): void {
  // no-op
}

export function setupPathForStep(step: SetupStep): string {
  return `/setup/${step}`;
}

export function nextPathAfterLanguage(): string {
  const state = getOnboardingSnapshot();
  if (!state.setupWizardComplete) {
    return setupPathForStep(state.setupStep || "contacts");
  }
  return "/home";
}

export function nextPathAfterVerify(): string {
  const state = getOnboardingSnapshot();
  if (!state.setupWizardComplete) return "/setup/contacts";
  return "/home";
}

export function isOnboardingFinished(
  state: OnboardingState = getOnboardingSnapshot(),
): boolean {
  return state.languageChosen && state.setupWizardComplete;
}

export function clearAuthenticatedOnboarding(): void {
  const current = getOnboardingSnapshot();
  saveOnboarding({
    ...current,
    emailVerified: false,
  });
}

export function restartSetupWizard(): void {
  saveOnboarding({
    ...getOnboardingSnapshot(),
    setupComplete: false,
    setupWizardComplete: false,
    setupStep: "contacts",
    flowFloor: "setup",
  });
}

export function restartOnboardingFromLanguage(): void {
  resetOnboarding();
}

export function resetOnboarding(): void {
  cache = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(PERSIST_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_LANGUAGE_KEY);
  }
  writeLangCookie(false);
  saveOnboarding({ ...DEFAULT });
}

export function flowFloorRank(floor: FlowFloor): number {
  return FLOOR_RANK[floor];
}
