import type { AppLanguage } from "@/lib/languages";
import { isAppLanguage } from "@/lib/languages";
import { markEmailVerified } from "@/lib/storage/onboarding";
import type { AccessibilityPreferences, UserProfile } from "@/lib/db/schema";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  lang: AppLanguage;
};

/**
 * Apply account name/email after login without clobbering the language
 * the user already chose on this device.
 */
export function applyAuthToProfile(
  user: AuthUser,
  profile: UserProfile,
  prefs: AccessibilityPreferences,
): { profile: UserProfile; prefs: AccessibilityPreferences } {
  markEmailVerified();

  const deviceLang = isAppLanguage(prefs.language)
    ? prefs.language
    : isAppLanguage(profile.preferredLanguage)
      ? profile.preferredLanguage
      : null;
  // Device choice wins. Account lang is only a fallback for first-time setups.
  const language: AppLanguage = deviceLang ?? user.lang;

  return {
    profile: {
      ...profile,
      displayName: user.name || profile.displayName,
      email: user.email,
      preferredLanguage: language,
    },
    prefs: { ...prefs, language },
  };
}

export function authErrorMessage(
  code: string | undefined,
  strings: {
    authErrorInvalidEmail: string;
    authErrorNameRequired: string;
    authErrorPasswordShort: string;
    authErrorPasswordMismatch: string;
    authErrorEmailInUse: string;
    authErrorInvalidCredentials: string;
    authErrorSendFailed: string;
    authErrorResendTestMode: string;
    authErrorNotConfigured: string;
    authErrorDbUnavailable: string;
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
    case "resend_test_mode":
      return strings.authErrorResendTestMode;
    case "send_failed":
      return strings.authErrorSendFailed;
    case "not_configured":
      return strings.authErrorNotConfigured;
    case "name_required":
      return strings.authErrorNameRequired;
    case "db_unavailable":
      return strings.authErrorDbUnavailable;
    case "login_failed":
    case "signup_failed":
      return strings.authErrorDbUnavailable;
    default:
      return strings.authErrorGeneric;
  }
}
