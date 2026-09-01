"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/components/providers/app-provider";
import {
  buildDailyGreeting,
  markGreetedToday,
  shouldGreetToday,
} from "@/lib/routine/daily-greeting";
import { loadMedicalProfile } from "@/lib/storage/medical-profile";
import { getOnboardingSnapshot, isOnboardingFinished } from "@/lib/storage/onboarding";
import { loadRoutines } from "@/lib/storage/routines";
import { speakText } from "@/lib/speech";

/** Speaks today's routine once per day when the user opens Home. */
export function DailyGreeting() {
  const { prefs, profile, strings } = useApp();
  const spokeRef = useRef(false);

  useEffect(() => {
    if (spokeRef.current) return;
    const state = getOnboardingSnapshot();
    if (!isOnboardingFinished(state)) return;
    if (!shouldGreetToday()) return;

    spokeRef.current = true;
    const name = profile.displayName || strings.setupGreetingFriend;
    const message = buildDailyGreeting(
      name,
      loadRoutines(),
      loadMedicalProfile().medicines,
      {
        morning: strings.greetingMorning,
        afternoon: strings.greetingAfternoon,
        evening: strings.greetingEvening,
        item: strings.greetingItem,
        none: strings.greetingNone,
      },
    );

    markGreetedToday();
    speakText(message, { rate: prefs.voiceSpeed, lang: prefs.language });
  }, [prefs.language, prefs.voiceSpeed, profile.displayName, strings]);

  return null;
}
