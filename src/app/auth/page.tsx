"use client";

import { useRouter } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import {
  OnboardingLink,
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
      footer={
        <OnboardingLink
          onClick={() => {
            clearLanguageChoice();
            router.push("/");
          }}
        >
          {strings.authChangeLanguage}
        </OnboardingLink>
      }
    >
      <p className={onboardingMutedTextClass}>{strings.authWelcomeSteps}</p>

      <BigButton href="/auth/login" tone="primary">
        {strings.authLoginButton}
      </BigButton>

      <BigButton href="/auth/signup" tone="call">
        {strings.authCreateAccount}
      </BigButton>
    </OnboardingShell>
  );
}
