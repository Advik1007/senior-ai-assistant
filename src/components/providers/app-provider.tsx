"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AccessibilityPreferences, Contact, UserProfile } from "@/lib/db/schema";
import {
  applySessionToClient,
  cacheSessionToken,
  clearSessionOnClient,
  fetchSessionUserResilient,
  logoutSession,
  readCachedSessionUser,
  subscribeAuthLogout,
  type SessionUser,
} from "@/lib/auth/client-session";
import {
  DEFAULT_CONTACTS,
  getContactsSnapshot,
  saveContacts,
} from "@/lib/storage/contacts";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  getPreferencesSnapshot,
  getProfileSnapshot,
  savePreferences,
  saveProfile,
} from "@/lib/storage/preferences";
import { subscribeStore } from "@/lib/storage/store-events";
import { t } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/languages";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

type AppContextValue = {
  prefs: AccessibilityPreferences;
  setPrefs: (next: AccessibilityPreferences) => void;
  profile: UserProfile;
  setProfile: (next: UserProfile) => void;
  contacts: Contact[];
  setContacts: (next: Contact[]) => void;
  strings: ReturnType<typeof t>;
  lang: AppLanguage;
  ready: boolean;
  authStatus: AuthStatus;
  sessionUser: SessionUser | null;
  /** Call after password signup/login so OnboardingGate sees authenticated state. */
  completeLogin: (user: SessionUser, token?: string) => void;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(
    subscribeStore,
    getPreferencesSnapshot,
    () => DEFAULT_PREFERENCES,
  );
  const profile = useSyncExternalStore(
    subscribeStore,
    getProfileSnapshot,
    () => DEFAULT_PROFILE,
  );
  const contacts = useSyncExternalStore(
    subscribeStore,
    getContactsSnapshot,
    () => DEFAULT_CONTACTS,
  );

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const setPrefs = useCallback((next: AccessibilityPreferences) => {
    savePreferences(next);
  }, []);

  const setProfile = useCallback((next: UserProfile) => {
    saveProfile(next);
  }, []);

  const setContacts = useCallback((next: Contact[]) => {
    saveContacts(next);
  }, []);

  const completeLogin = useCallback((user: SessionUser, token?: string) => {
    if (token) cacheSessionToken(token);
    applySessionToClient(user);
    setSessionUser(user);
    setAuthStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
    setSessionUser(null);
    setAuthStatus("anonymous");
    window.location.href = "/auth/login";
  }, []);

  useLayoutEffect(() => {
    // Restore before paint so OnboardingGate does not flash Loading…
    const cached = readCachedSessionUser();
    if (cached) {
      setSessionUser(cached);
      setAuthStatus("authenticated");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const cached = readCachedSessionUser();

    void (async () => {
      const { user, unauthorized } = await fetchSessionUserResilient();
      if (cancelled) return;

      if (user) {
        applySessionToClient(user);
        setSessionUser(user);
        setAuthStatus("authenticated");
        return;
      }

      if (unauthorized) {
        clearSessionOnClient();
        setSessionUser(null);
        setAuthStatus("anonymous");
        return;
      }

      // Network blip: keep cached login if we have one.
      if (cached) {
        setSessionUser(cached);
        setAuthStatus("authenticated");
        return;
      }

      clearSessionOnClient();
      setSessionUser(null);
      setAuthStatus("anonymous");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeAuthLogout(() => {
      clearSessionOnClient();
      setSessionUser(null);
      setAuthStatus("anonymous");
      if (!window.location.pathname.startsWith("/auth/")) {
        window.location.href = "/auth/login";
      }
    });
  }, []);

  const lang = prefs.language;
  const strings = t(lang);
  const ready = authStatus !== "loading";

  const value = useMemo(
    () => ({
      prefs,
      setPrefs,
      profile,
      setProfile,
      contacts,
      setContacts,
      strings,
      lang,
      ready,
      authStatus,
      sessionUser,
      completeLogin,
      logout,
    }),
    [
      prefs,
      setPrefs,
      profile,
      setProfile,
      contacts,
      setContacts,
      strings,
      lang,
      ready,
      authStatus,
      sessionUser,
      completeLogin,
      logout,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
