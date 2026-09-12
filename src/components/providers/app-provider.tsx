"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
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
  readSessionToken,
  subscribeAuthLogout,
  type SessionUser,
} from "@/lib/auth/client-session";
import { hydrateOnboardingFromNative } from "@/lib/storage/native-onboarding";
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
import { isAppLanguage, DEFAULT_LANGUAGE, type AppLanguage } from "@/lib/languages";
import type { AuthStatus } from "@/lib/onboarding/decide-route";

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
  completeLogin: (user: SessionUser, token?: string) => void;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function initialSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  return readCachedSessionUser();
}

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

  // Hydrate from local cache immediately — never start as a blank "null session"
  // that the gate can treat as anonymous before /api/auth/me returns.
  const cachedAtStart = initialSessionUser();
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() =>
    cachedAtStart ? "authenticated" : "loading",
  );
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(
    () => cachedAtStart,
  );

  /** Bumped on login/logout so in-flight /me responses cannot clobber a fresh session. */
  const authEpoch = useRef(0);

  const setPrefs = useCallback((next: AccessibilityPreferences) => {
    const language = isAppLanguage(next.language)
      ? next.language
      : DEFAULT_LANGUAGE;
    savePreferences({ ...next, language });
  }, []);

  const setProfile = useCallback((next: UserProfile) => {
    saveProfile(next);
  }, []);

  const setContacts = useCallback((next: Contact[]) => {
    saveContacts(next);
  }, []);

  const completeLogin = useCallback((user: SessionUser, token?: string) => {
    authEpoch.current += 1;
    if (token) cacheSessionToken(token);
    applySessionToClient(user);
    setSessionUser(user);
    setAuthStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    authEpoch.current += 1;
    await logoutSession();
    setSessionUser(null);
    setAuthStatus("anonymous");
    window.location.href = "/auth/login";
  }, []);

  useLayoutEffect(() => {
    void (async () => {
      await hydrateOnboardingFromNative();
      const cached = readCachedSessionUser();
      if (cached) {
        applySessionToClient(cached);
        setSessionUser(cached);
        setAuthStatus("authenticated");
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    const epochAtStart = authEpoch.current;
    const cached = readCachedSessionUser();

    void (async () => {
      const { user, unauthorized, error } = await fetchSessionUserResilient();
      if (cancelled) return;
      // Login/logout happened while /me was in flight — ignore stale result.
      if (epochAtStart !== authEpoch.current) return;

      if (user) {
        applySessionToClient(user);
        setSessionUser(user);
        setAuthStatus("authenticated");
        return;
      }

      if (unauthorized) {
        // Keep a locally established session (Bearer token) if /me cookie failed
        // but we still have a token + cached user from a successful login.
        const stillCached = readCachedSessionUser();
        const token = readSessionToken();
        if (stillCached && token) {
          applySessionToClient(stillCached);
          setSessionUser(stillCached);
          setAuthStatus("authenticated");
          return;
        }
        clearSessionOnClient();
        setSessionUser(null);
        setAuthStatus("anonymous");
        return;
      }

      if (cached || readCachedSessionUser()) {
        const keep = cached || readCachedSessionUser();
        if (keep) {
          applySessionToClient(keep);
          setSessionUser(keep);
          setAuthStatus("authenticated");
          return;
        }
      }

      // Network /me failure must NOT wall the app with a generic error screen.
      // Stay anonymous so language / login still work; retry quietly.
      if (error) {
        setSessionUser(null);
        setAuthStatus("anonymous");
        if (cancelled) return;
        retryTimer = window.setTimeout(() => {
          if (cancelled || authEpoch.current !== epochAtStart) return;
          void fetchSessionUserResilient().then((again) => {
            if (cancelled || authEpoch.current !== epochAtStart) return;
            if (!again.user) return;
            applySessionToClient(again.user);
            setSessionUser(again.user);
            setAuthStatus("authenticated");
          });
        }, 1500);
        return;
      }

      clearSessionOnClient();
      setSessionUser(null);
      setAuthStatus("anonymous");
    })();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    return subscribeAuthLogout(() => {
      authEpoch.current += 1;
      clearSessionOnClient();
      setSessionUser(null);
      setAuthStatus("anonymous");
      if (!window.location.pathname.startsWith("/auth/")) {
        window.location.href = "/auth/login";
      }
    });
  }, []);

  const lang = isAppLanguage(prefs.language) ? prefs.language : DEFAULT_LANGUAGE;
  // Bundled static catalogs only — instant switch, no translation API / loading gate.
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
