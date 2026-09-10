"use client";

import { useRouter } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import {
  OnboardingShell,
  onboardingMutedTextClass,
} from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { clearLanguageChoice } from "@/lib/storage/onboarding";

/**
 * After language: choose Sign in or Create account, then setup wizard → home.
 */
export default function AuthWelcomePage() {
  const router = useRouter();
  const { strings, lang } = useApp();

  return (
    <OnboardingShell
      lang={lang}
      title={strings.authWelcomeTitle}
      subtitle={strings.authWelcomeBody}
    >
      <p className={onboardingMutedTextClass}>{strings.authWelcomeSteps}</p>

      <BigButton
        tone="primary"
        onClick={() => {
          window.location.assign("/auth/login");
        }}
      >
        {strings.authLoginButton}
      </BigButton>

      <BigButton
        tone="call"
        onClick={() => {
          window.location.assign("/auth/signup");
        }}
      >
        {strings.authCreateAccount}
      </BigButton>

      <BigButton
        tone="muted"
        onClick={() => {
          clearLanguageChoice();
          // Hard navigate — soft replace can lose to the onboarding gate in WebView.
          window.location.assign("/start");
        }}
      >
        {strings.authChangeLanguage}
      </BigButton>
    </OnboardingShell>
  );
}
