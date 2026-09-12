import type { AccessibilityPreferences, UserProfile } from "@/lib/db/schema";
import { isAppLanguage, DEFAULT_LANGUAGE } from "@/lib/languages";
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
let prefsWriteTimer: ReturnType<typeof setTimeout> | null = null;
let profileWriteTimer: ReturnType<typeof setTimeout> | null = null;
const PERSIST_MS = 250;

function normalizePrefs(
  raw: Partial<AccessibilityPreferences>,
): AccessibilityPreferences {
  const language = isAppLanguage(raw.language ?? "")
    ? raw.language!
    : DEFAULT_LANGUAGE;
  return { ...DEFAULT_PREFERENCES, ...raw, language };
}

export function getPreferencesSnapshot(): AccessibilityPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  if (!prefsCache) {
    prefsCache = normalizePrefs(
      readJson<Partial<AccessibilityPreferences>>(PREFS_KEY, {}),
    );
  }
  return prefsCache;
}

export function loadPreferences(): AccessibilityPreferences {
  return getPreferencesSnapshot();
}

/**
 * Update prefs in memory immediately; debounce disk write.
 * Use emit=false while typing drafts so the whole app doesn't re-render.
 */
function samePrefs(
  a: AccessibilityPreferences,
  b: AccessibilityPreferences,
): boolean {
  return (
    a.textSize === b.textSize &&
    a.highContrast === b.highContrast &&
    a.accessibilityMode === b.accessibilityMode &&
    a.voiceSpeed === b.voiceSpeed &&
    a.language === b.language
  );
}

export function savePreferences(
  prefs: AccessibilityPreferences,
  opts?: { emit?: boolean; flush?: boolean },
): void {
  const previous = prefsCache;
  prefsCache = prefs;
  const emit = opts?.emit !== false;
  const flush = opts?.flush === true;
  const unchanged = Boolean(previous && samePrefs(previous, prefs));

  const persist = () => {
    prefsWriteTimer = null;
    writeJson(PREFS_KEY, prefsCache!);
  };

  if (!unchanged) {
    if (prefsWriteTimer) clearTimeout(prefsWriteTimer);
    if (flush) {
      persist();
    } else {
      prefsWriteTimer = setTimeout(persist, PERSIST_MS);
    }
  }
  if (emit && !unchanged) emitStore();
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

export function saveProfile(
  profile: UserProfile,
  opts?: { emit?: boolean; flush?: boolean },
): void {
  profileCache = profile;
  const emit = opts?.emit !== false;
  const flush = opts?.flush === true;

  const persist = () => {
    profileWriteTimer = null;
    writeJson(PROFILE_KEY, profileCache!);
  };

  if (profileWriteTimer) clearTimeout(profileWriteTimer);
  if (flush) {
    persist();
  } else {
    profileWriteTimer = setTimeout(persist, PERSIST_MS);
  }
  if (emit) emitStore();
}
