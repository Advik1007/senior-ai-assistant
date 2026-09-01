import type { AppLanguage } from "@/lib/languages";
import { markEmailVerified } from "@/lib/storage/onboarding";
import type { AccessibilityPreferences, UserProfile } from "@/lib/db/schema";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  lang: AppLanguage;
};

export function applyAuthToProfile(
  user: AuthUser,
  profile: UserProfile,
  prefs: AccessibilityPreferences,
): { profile: UserProfile; prefs: AccessibilityPreferences } {
  markEmailVerified();
  return {
    profile: {
      ...profile,
      displayName: user.name,
      email: user.email,
      preferredLanguage: user.lang,
    },
    prefs: { ...prefs, language: user.lang },
  };
}

export function authErrorMessage(
  code: string | undefined,
  strings: {
    authErrorInvalidEmail: string;
    authErrorPasswordShort: string;
    authErrorPasswordMismatch: string;
    authErrorEmailInUse: string;
    authErrorInvalidCredentials: string;
    authErrorSendFailed: string;
    authErrorNotConfigured: string;
    authErrorGeneric: string;
  },
): string {
  switch (code) {
    case "invalid_email":
      return strings.authErrorInvalidEmail;
    case "password_short":
      return strings.authErrorPasswordShort;
    case "password_mismatch":
      return strings.authErrorPasswordMismatch;
    case "email_in_use":
      return strings.authErrorEmailInUse;
    case "invalid_credentials":
      return strings.authErrorInvalidCredentials;
    case "send_failed":
      return strings.authErrorSendFailed;
    case "not_configured":
      return strings.authErrorNotConfigured;
    case "name_required":
      return strings.authErrorGeneric;
    default:
      return strings.authErrorGeneric;
  }
}
