import type { AppLanguage } from "@/lib/languages";
import { isAppLanguage } from "@/lib/languages";
import type { AccessibilityPreferences, UserProfile } from "@/lib/db/schema";
import {
  clearAuthenticatedOnboarding,
  getOnboardingSnapshot,
  markEmailVerified,
  markLanguageChosen,
  markSetupComplete,
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
  setupCompleted: boolean;
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
      setupCompleted: Boolean(parsed.setupCompleted),
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

function parseUser(data: {
  user?: Partial<SessionUser> & { setupCompleted?: boolean };
}): SessionUser | null {
  const u = data.user;
  if (!u?.id || !u.email || typeof u.name !== "string") return null;
  if (typeof u.lang !== "string" || !isAppLanguage(u.lang)) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    lang: u.lang,
    setupCompleted: Boolean(u.setupCompleted),
  };
}

export async function fetchSessionResult(): Promise<SessionFetchResult> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
      headers: authHeaders(),
    });
    if (res.status === 401) return { status: "unauthorized" };
    if (!res.ok) return { status: "error" };
    const data = (await res.json()) as {
      ok?: boolean;
      user?: Partial<SessionUser>;
    };
    const user = data.ok ? parseUser(data) : null;
    if (!user) return { status: "unauthorized" };
    return { status: "ok", user };
  } catch {
    return { status: "error" };
  }
}

/** Retries briefly — Turso / network blips should not force login or language. */
export async function fetchSessionUserResilient(): Promise<{
  user: SessionUser | null;
  unauthorized: boolean;
  error: boolean;
}> {
  let sawUnauthorized = false;
  let sawError = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await fetchSessionResult();
    if (result.status === "ok") {
      return { user: result.user, unauthorized: false, error: false };
    }
    if (result.status === "unauthorized") {
      sawUnauthorized = true;
      break;
    }
    sawError = true;
    await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
  }
  return {
    user: null,
    unauthorized: sawUnauthorized,
    error: sawError && !sawUnauthorized,
  };
}

/**
 * Hydrate local onboarding from the authenticated account.
 * Server setup_completed / lang win when local storage was cleared.
 */
export function applySessionToClient(user: SessionUser): void {
  cacheSessionUser(user);
  const prefs = getPreferencesSnapshot();
  const profile = getProfileSnapshot();
  const onboarding = getOnboardingSnapshot();

  const language: AppLanguage =
    onboarding.languageChosen && isAppLanguage(prefs.language)
      ? prefs.language
      : user.lang;

  savePreferences({ ...prefs, language });
  saveProfile({
    ...profile,
    displayName: user.name || profile.displayName,
    email: user.email,
    preferredLanguage: language,
  });

  // Authenticated account always has a language — never bounce to Language.
  markLanguageChosen();
  markEmailVerified();

  if (user.setupCompleted) {
    markSetupComplete();
  }
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

export async function persistSetupComplete(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/complete-setup", {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: Partial<SessionUser>;
      token?: string;
    };
    const user = parseUser(data);
    if (user) {
      if (data.token) cacheSessionToken(data.token);
      applySessionToClient(user);
    }
    return user;
  } catch {
    return null;
  }
}

export async function persistAccountLanguage(
  lang: AppLanguage,
): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/language", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ lang }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: Partial<SessionUser>;
      token?: string;
    };
    const user = parseUser(data);
    if (user) {
      if (data.token) cacheSessionToken(data.token);
      applySessionToClient(user);
    }
    return user;
  } catch {
    return null;
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
