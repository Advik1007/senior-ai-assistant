import { readJson, writeJson } from "@/lib/storage/local-store";
import { emitStore } from "@/lib/storage/store-events";

const PERSIST_KEY = "unk.onboarding";
/** Backup cookie so Language↔Welcome cannot loop if localStorage is flaky. */
const LANG_COOKIE = "unk_lang_chosen";
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
  callsSetup: boolean;
  setupComplete: boolean;
  setupWizardComplete: boolean;
  setupStep: SetupStep;
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

function buildState(persisted: PersistedOnboarding): OnboardingState {
  const fromStorage = !!persisted.languageChosen;
  const fromCookie = readLangCookie();
  const languageChosen = fromStorage || fromCookie;

  // Heal storage if cookie survived but localStorage was cleared.
  if (languageChosen && !fromStorage) {
    try {
      writeJson(PERSIST_KEY, {
        ...persisted,
        languageChosen: true,
      });
    } catch {
      // ignore
    }
  }
  if (languageChosen && !fromCookie) {
    writeLangCookie(true);
  }

  return {
    languageChosen,
    emailVerified: !!persisted.emailVerified,
    setupComplete: !!persisted.setupComplete,
    setupWizardComplete: !!persisted.setupWizardComplete,
    setupStep: persisted.setupStep ?? "contacts",
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

/** Force re-read from disk/cookie (after external writes). */
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
  });
  emitStore();
}

/** Only call from the language selection screen after the user taps a language. */
export function markLanguageChosen(): void {
  const current = getOnboardingSnapshot();
  saveOnboarding({ ...current, languageChosen: true });
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
  // Intentionally no-op.
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

/** Clears auth flags but keeps language choice and setup progress. */
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
