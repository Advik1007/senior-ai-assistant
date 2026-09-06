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
const SESSION_CACHE_KEY = "unk.session.user";
const SESSION_TOKEN_KEY = "unk.session.token";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  lang: AppLanguage;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readCachedSessionUser(): SessionUser | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (
      !parsed?.id ||
      !parsed.email ||
      typeof parsed.name !== "string" ||
      typeof parsed.lang !== "string" ||
      !isAppLanguage(parsed.lang)
    ) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      lang: parsed.lang,
    };
  } catch {
    return null;
  }
}

export function cacheSessionUser(user: SessionUser): void {
  if (!canUseStorage()) return;
  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
}

export function clearCachedSessionUser(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(SESSION_CACHE_KEY);
}

export function readSessionToken(): string | null {
  if (!canUseStorage()) return null;
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function cacheSessionToken(token: string): void {
  if (!canUseStorage()) return;
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  const token = readSessionToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export type SessionFetchResult =
  | { status: "ok"; user: SessionUser }
  | { status: "unauthorized" }
  | { status: "error" };

export async function fetchSessionResult(): Promise<SessionFetchResult> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
      headers: authHeaders(),
    });
    if (res.status === 401) return { status: "unauthorized" };
    if (!res.ok) return { status: "error" };
    const data = (await res.json()) as { ok?: boolean; user?: SessionUser };
    if (data.ok && data.user) return { status: "ok", user: data.user };
    return { status: "unauthorized" };
  } catch {
    return { status: "error" };
  }
}

export async function fetchSessionUser(): Promise<SessionUser | null> {
  const result = await fetchSessionResult();
  return result.status === "ok" ? result.user : null;
}

/** Retries briefly — Turso / network blips should not force login. */
export async function fetchSessionUserResilient(): Promise<{
  user: SessionUser | null;
  unauthorized: boolean;
}> {
  let sawUnauthorized = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await fetchSessionResult();
    if (result.status === "ok") {
      return { user: result.user, unauthorized: false };
    }
    if (result.status === "unauthorized") {
      sawUnauthorized = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
  }
  return { user: null, unauthorized: sawUnauthorized };
}

export function applySessionToClient(user: SessionUser): void {
  cacheSessionUser(user);
  const prefs = getPreferencesSnapshot();
  const profile = getProfileSnapshot();
  const onboarding = getOnboardingSnapshot();

  // Never mark language chosen here — only the language screen may do that.
  if (onboarding.languageChosen) {
    const language: AppLanguage = isAppLanguage(prefs.language)
      ? prefs.language
      : user.lang;
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
  clearCachedSessionUser();
  clearSessionToken();
  clearAuthenticatedOnboarding();
}

export async function logoutSession(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
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
