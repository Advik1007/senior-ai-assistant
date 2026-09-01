"use client";

import { onboardingMutedTextClass } from "@/components/OnboardingShell";

export function SetupStepLabel({
  step,
  label,
}: {
  step: 1 | 2 | 3 | 4;
  label: string;
}) {
  return (
    <p className={`${onboardingMutedTextClass} font-semibold uppercase tracking-wide`}>
      {label.replace("{step}", String(step)).replace("{total}", "4")}
    </p>
  );
}
