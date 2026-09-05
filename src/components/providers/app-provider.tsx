"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AccessibilityPreferences, Contact, UserProfile } from "@/lib/db/schema";
import {
  applySessionToClient,
  clearSessionOnClient,
  fetchSessionUser,
  logoutSession,
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
  completeLogin: (user: SessionUser) => void;
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

  const completeLogin = useCallback((user: SessionUser) => {
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

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const user = await fetchSessionUser();
      if (cancelled) return;

      if (user) {
        applySessionToClient(user);
        setSessionUser(user);
        setAuthStatus("authenticated");
      } else {
        clearSessionOnClient();
        setSessionUser(null);
        setAuthStatus("anonymous");
      }
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
