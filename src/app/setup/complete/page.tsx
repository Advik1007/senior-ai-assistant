"use client";

import { BigButton } from "@/components/BigButton";
import { SetupStepLabel } from "@/components/setup/SetupStepLabel";
import { OnboardingShell } from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { persistSetupComplete } from "@/lib/auth/client-session";
import { markSetupComplete } from "@/lib/storage/onboarding";

export default function SetupCompletePage() {
  const { strings, lang, completeLogin } = useApp();

  async function continueHome() {
    markSetupComplete();
    const user = await persistSetupComplete();
    if (user) completeLogin(user);
    window.location.assign("/home");
  }

  return (
    <OnboardingShell
      lang={lang}
      title={strings.setupCompleteTitle}
      tagline={strings.tagline}
    >
      <SetupStepLabel step={4} label={strings.setupStepComplete} />
      <p className="text-center text-xl font-bold text-[#0B1F3A]">
        {strings.setupCompleteSubtitle}
      </p>
      <p className="text-center text-lg leading-relaxed text-[#5a6f85]">
        {strings.setupCompleteReady}
      </p>
      <BigButton
        tone="gold"
        className="mt-2"
        onClick={() => void continueHome()}
      >
        {strings.setupCompleteContinue}
      </BigButton>
    </OnboardingShell>
  );
}
