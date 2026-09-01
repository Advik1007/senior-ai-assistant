import { readJson, writeJson } from "@/lib/storage/local-store";
import { emitStore } from "@/lib/storage/store-events";

const PERSIST_KEY = "unk.onboarding";
/** @deprecated migrated to localStorage field languageChosen */
const LEGACY_SESSION_LANGUAGE_KEY = "unk.session.languageChosen";

export type SetupStep = "contacts" | "routine" | "medicines" | "complete";

export type OnboardingState = {
  languageChosen: boolean;
  emailVerified: boolean;
  /** @deprecated kept for migration; use setupWizardComplete */
  setupComplete: boolean;
  /** True only after finishing /setup/complete (party popper screen). */
  setupWizardComplete: boolean;
  setupStep: SetupStep;
};

const DEFAULT: OnboardingState = {
  languageChosen: false,
  emailVerified: false,
  setupComplete: false,
  setupWizardComplete: false,
  setupStep: "contacts",
};

let cache: OnboardingState | null = null;

type PersistedOnboarding = Partial<{
  languageChosen: boolean;
  emailVerified: boolean;
  /** @deprecated old flag — no longer counts as setup complete */
  callsSetup: boolean;
  setupComplete: boolean;
  setupWizardComplete: boolean;
  setupStep: SetupStep;
}>;

function migrateLegacyLanguageFlag(persisted: PersistedOnboarding): boolean {
  if (persisted.languageChosen) return true;
  if (typeof window === "undefined") return false;
  const legacy = window.sessionStorage.getItem(LEGACY_SESSION_LANGUAGE_KEY) === "1";
  if (legacy) {
    window.sessionStorage.removeItem(LEGACY_SESSION_LANGUAGE_KEY);
    return true;
  }
  return false;
}

function readPersisted(): PersistedOnboarding {
  return readJson<PersistedOnboarding>(PERSIST_KEY, {});
}

export function getOnboardingSnapshot(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT;
  if (!cache) {
    const persisted = readPersisted();
    cache = {
      languageChosen: migrateLegacyLanguageFlag(persisted),
      emailVerified: !!persisted.emailVerified,
      setupComplete: !!persisted.setupComplete,
      setupWizardComplete: !!persisted.setupWizardComplete,
      setupStep: persisted.setupStep ?? "contacts",
    };
  }
  return cache;
}

export function saveOnboarding(state: OnboardingState): void {
  cache = state;
  writeJson(PERSIST_KEY, {
    languageChosen: state.languageChosen,
    emailVerified: state.emailVerified,
    setupComplete: state.setupComplete,
    setupWizardComplete: state.setupWizardComplete,
    setupStep: state.setupStep,
  });
  emitStore();
}

export function markLanguageChosen(): void {
  saveOnboarding({ ...getOnboardingSnapshot(), languageChosen: true });
}

export function clearLanguageChoice(): void {
  saveOnboarding({ ...getOnboardingSnapshot(), languageChosen: false });
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

export function markSetupStep(step: SetupStep): void {
  saveOnboarding({
    ...getOnboardingSnapshot(),
    setupStep: step,
    setupComplete: false,
    setupWizardComplete: false,
  });
}

export function markSetupComplete(): void {
  saveOnboarding({
    ...getOnboardingSnapshot(),
    setupComplete: true,
    setupWizardComplete: true,
    setupStep: "complete",
  });
}

/** @deprecated Old phone/contacts screen — does not finish the setup wizard. */
export function markCallsSetup(): void {
  // Intentionally no-op: users must complete /setup/* through /setup/complete.
}

export function setupPathForStep(step: SetupStep): string {
  return `/setup/${step}`;
}

/** Next URL after language is chosen (caller should send to login if not authenticated). */
export function nextPathAfterLanguage(): string {
  const state = getOnboardingSnapshot();
  if (!state.setupWizardComplete) {
    return setupPathForStep(state.setupStep || "contacts");
  }
  return "/home";
}

/** Next URL after email is verified. */
export function nextPathAfterVerify(): string {
  const state = getOnboardingSnapshot();
  if (!state.setupWizardComplete) return "/setup/contacts";
  return "/home";
}

/** User finished language, login, and the contacts → routine → medicines wizard. */
export function isOnboardingFinished(
  state: OnboardingState = getOnboardingSnapshot(),
): boolean {
  return state.languageChosen && state.setupWizardComplete;
}

/** Clears auth flags but keeps language choice and setup progress. */
export function clearAuthenticatedOnboarding(): void {
  const current = getOnboardingSnapshot();
  saveOnboarding({
    ...current,
    emailVerified: false,
  });
}

/** Run contacts → routine → medicines → complete again (keeps language + login). */
export function restartSetupWizard(): void {
  saveOnboarding({
    ...getOnboardingSnapshot(),
    setupComplete: false,
    setupWizardComplete: false,
    setupStep: "contacts",
  });
}

/** Full first-time flow from language selection. */
export function restartOnboardingFromLanguage(): void {
  resetOnboarding();
}

export function resetOnboarding(): void {
  cache = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(PERSIST_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_LANGUAGE_KEY);
  }
  saveOnboarding({ ...DEFAULT });
}
