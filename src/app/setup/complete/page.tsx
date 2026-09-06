"use client";

import { useRouter } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import { PartyPopper } from "@/components/setup/PartyPopper";
import { SetupStepLabel } from "@/components/setup/SetupStepLabel";
import { OnboardingShell } from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { persistSetupComplete } from "@/lib/auth/client-session";
import { markSetupComplete } from "@/lib/storage/onboarding";

export default function SetupCompletePage() {
  const router = useRouter();
  const { strings, lang, completeLogin } = useApp();

  async function continueHome() {
    // Local flag immediately so the gate does not bounce back into setup.
    markSetupComplete();
    const user = await persistSetupComplete();
    if (user) completeLogin(user);
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
      <BigButton
        tone="call"
        className="mt-4"
        onClick={() => void continueHome()}
      >
        {strings.setupCompleteContinue}
      </BigButton>
    </OnboardingShell>
  );
}
