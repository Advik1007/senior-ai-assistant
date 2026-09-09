/**
 * Native-durable onboarding flags for the Android Capacitor app.
 * WebView localStorage alone is not reliable enough across WebView reloads.
 */

import { Capacitor } from "@capacitor/core";
import type { OnboardingState, SetupStep } from "@/lib/storage/onboarding";

const NATIVE_KEY = "unk.onboarding.v1";

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

type NativePayload = {
  languageChosen: boolean;
  emailVerified: boolean;
  setupComplete: boolean;
  setupWizardComplete: boolean;
  setupStep: SetupStep;
  flowFloor?: string;
  language?: string;
};

async function preferences() {
  const mod = await import("@capacitor/preferences");
  return mod.Preferences;
}

export async function persistOnboardingToNative(
  state: OnboardingState,
  language?: string,
): Promise<void> {
  if (!isNative()) return;
  try {
    const Preferences = await preferences();
    const payload: NativePayload = {
      languageChosen: state.languageChosen,
      emailVerified: state.emailVerified,
      setupComplete: state.setupComplete,
      setupWizardComplete: state.setupWizardComplete,
      setupStep: state.setupStep,
      flowFloor: state.flowFloor,
      language,
    };
    await Preferences.set({
      key: NATIVE_KEY,
      value: JSON.stringify(payload),
    });
  } catch {
    // Native write failed — localStorage/cookie still hold a copy.
  }
}

export async function hydrateOnboardingFromNative(): Promise<OnboardingState | null> {
  if (!isNative()) return null;
  try {
    const Preferences = await preferences();
    const { value } = await Preferences.get({ key: NATIVE_KEY });
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<NativePayload>;

    const { getOnboardingSnapshot, saveOnboarding } = await import(
      "@/lib/storage/onboarding"
    );
    const local = getOnboardingSnapshot();

    const { flowFloorRank } = await import("@/lib/storage/onboarding");
    const nativeFloor =
      (parsed.flowFloor as OnboardingState["flowFloor"]) || "language";
    const localFloor = local.flowFloor || "language";
    const flowFloor =
      flowFloorRank(nativeFloor) >= flowFloorRank(localFloor)
        ? nativeFloor
        : localFloor;

    const merged: OnboardingState = {
      languageChosen: Boolean(parsed.languageChosen || local.languageChosen),
      emailVerified: Boolean(parsed.emailVerified || local.emailVerified),
      setupComplete: Boolean(parsed.setupComplete || local.setupComplete),
      setupWizardComplete: Boolean(
        parsed.setupWizardComplete || local.setupWizardComplete,
      ),
      setupStep: (parsed.setupStep ||
        local.setupStep ||
        "contacts") as SetupStep,
      flowFloor,
    };

    saveOnboarding(merged);

    if (parsed.language && typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("unk.preferences");
        const prefs = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        window.localStorage.setItem(
          "unk.preferences",
          JSON.stringify({ ...prefs, language: parsed.language }),
        );
      } catch {
        // ignore
      }
    }

    return merged;
  } catch {
    return null;
  }
}

export async function clearNativeOnboarding(): Promise<void> {
  if (!isNative()) return;
  try {
    const Preferences = await preferences();
    await Preferences.remove({ key: NATIVE_KEY });
  } catch {
    // ignore
  }
}
