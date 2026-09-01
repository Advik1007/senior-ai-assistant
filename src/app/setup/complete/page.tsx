"use client";

import { useRouter } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import { PartyPopper } from "@/components/setup/PartyPopper";
import { SetupStepLabel } from "@/components/setup/SetupStepLabel";
import { OnboardingShell } from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { markSetupComplete } from "@/lib/storage/onboarding";

export default function SetupCompletePage() {
  const router = useRouter();
  const { strings, lang } = useApp();

  function continueHome() {
    markSetupComplete();
    router.push("/home");
  }

  return (
    <OnboardingShell
      lang={lang}
      title={`🎉 ${strings.setupCompleteTitle}`}
      tagline={strings.tagline}
    >
      <SetupStepLabel step={4} label={strings.setupStepComplete} />
      <PartyPopper />
      <p className="text-center text-2xl font-bold">{strings.setupCompleteSubtitle}</p>
      <p className="text-center text-xl leading-relaxed">{strings.setupCompleteReady}</p>
      <BigButton tone="call" className="mt-4" onClick={continueHome}>
        {strings.setupCompleteContinue}
      </BigButton>
    </OnboardingShell>
  );
}
