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
          router.replace("/auth/login");
        }}
      >
        {strings.authLoginButton}
      </BigButton>

      <BigButton
        tone="call"
        onClick={() => {
          router.replace("/auth/signup");
        }}
      >
        {strings.authCreateAccount}
      </BigButton>

      <BigButton
        tone="muted"
        onClick={() => {
          clearLanguageChoice();
          router.replace("/start");
        }}
      >
        {strings.authChangeLanguage}
      </BigButton>
    </OnboardingShell>
  );
}
