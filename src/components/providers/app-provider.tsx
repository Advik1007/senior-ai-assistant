"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { AccessibilityPreferences, Contact, UserProfile } from "@/lib/db/schema";
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
import { t, type Lang } from "@/lib/i18n";

type AppContextValue = {
  prefs: AccessibilityPreferences;
  setPrefs: (next: AccessibilityPreferences) => void;
  profile: UserProfile;
  setProfile: (next: UserProfile) => void;
  contacts: Contact[];
  setContacts: (next: Contact[]) => void;
  strings: ReturnType<typeof t>;
  lang: Lang;
  ready: boolean;
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

  const setPrefs = useCallback((next: AccessibilityPreferences) => {
    savePreferences(next);
  }, []);

  const setProfile = useCallback((next: UserProfile) => {
    saveProfile(next);
  }, []);

  const setContacts = useCallback((next: Contact[]) => {
    saveContacts(next);
  }, []);

  const lang = prefs.language;
  const strings = t(lang);

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
      ready: true,
    }),
    [prefs, setPrefs, profile, setProfile, contacts, setContacts, strings, lang],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
