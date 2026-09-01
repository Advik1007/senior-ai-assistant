import type { AccessibilityPreferences, UserProfile } from "@/lib/db/schema";
import { readJson, writeJson } from "@/lib/storage/local-store";
import { emitStore } from "@/lib/storage/store-events";

const PREFS_KEY = "unk.preferences";
const PROFILE_KEY = "unk.profile";

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  textSize: "extra-large",
  highContrast: false,
  accessibilityMode: true,
  voiceSpeed: 0.85,
  language: "en",
};

export const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  email: "",
  phone: "",
  preferredLanguage: "en",
};

let prefsCache: AccessibilityPreferences | null = null;
let profileCache: UserProfile | null = null;

export function getPreferencesSnapshot(): AccessibilityPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  if (!prefsCache) {
    prefsCache = {
      ...DEFAULT_PREFERENCES,
      ...readJson<Partial<AccessibilityPreferences>>(PREFS_KEY, {}),
    };
  }
  return prefsCache;
}

export function loadPreferences(): AccessibilityPreferences {
  return getPreferencesSnapshot();
}

export function savePreferences(prefs: AccessibilityPreferences): void {
  prefsCache = prefs;
  writeJson(PREFS_KEY, prefs);
  emitStore();
}

export function getProfileSnapshot(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  if (!profileCache) {
    profileCache = {
      ...DEFAULT_PROFILE,
      ...readJson<Partial<UserProfile>>(PROFILE_KEY, {}),
    };
  }
  return profileCache;
}

export function loadProfile(): UserProfile {
  return getProfileSnapshot();
}

export function saveProfile(profile: UserProfile): void {
  profileCache = profile;
  writeJson(PROFILE_KEY, profile);
  emitStore();
}
