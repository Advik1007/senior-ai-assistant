import type { AppLanguage } from "@/lib/languages";
import { isAppLanguage } from "@/lib/languages";
import type { AccessibilityPreferences, UserProfile } from "@/lib/db/schema";
import {
  clearAuthenticatedOnboarding,
  getOnboardingSnapshot,
  markEmailVerified,
} from "@/lib/storage/onboarding";
import {
  getPreferencesSnapshot,
  getProfileSnapshot,
  savePreferences,
  saveProfile,
} from "@/lib/storage/preferences";

export const AUTH_LOGOUT_EVENT_KEY = "unk.auth.logout";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  lang: AppLanguage;
};

export async function fetchSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; user?: SessionUser };
    return data.ok && data.user ? data.user : null;
  } catch {
    return null;
  }
}

export function applySessionToClient(user: SessionUser): void {
  const prefs = getPreferencesSnapshot();
  const profile = getProfileSnapshot();
  const onboarding = getOnboardingSnapshot();

  // Never mark language chosen here — only the language screen may do that.
  if (onboarding.languageChosen) {
    const language: AppLanguage =
      isAppLanguage(prefs.language) ? prefs.language : user.lang;
    savePreferences({ ...prefs, language });
    saveProfile({
      ...profile,
      displayName: user.name || profile.displayName,
      email: user.email,
      preferredLanguage: language,
    });
  } else {
    saveProfile({
      ...profile,
      displayName: user.name || profile.displayName,
      email: user.email,
    });
  }

  markEmailVerified();
}

export function clearSessionOnClient(): void {
  clearAuthenticatedOnboarding();
}

export async function logoutSession(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  clearSessionOnClient();
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_LOGOUT_EVENT_KEY, String(Date.now()));
  }
}

export function subscribeAuthLogout(onLogout: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  function onStorage(event: StorageEvent) {
    if (event.key === AUTH_LOGOUT_EVENT_KEY) onLogout();
  }

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
