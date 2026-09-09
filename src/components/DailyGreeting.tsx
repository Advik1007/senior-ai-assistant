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

/** Speaks today's routine once per day — deferred until after first paint. */
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

    const speak = () => {
      speakText(message, { rate: prefs.voiceSpeed, lang: prefs.language });
    };

    // Keep TTS off the first-paint / scroll critical path.
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric(speak, { timeout: 2500 });
      return () => {
        const cancel = (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback;
        cancel?.(id);
      };
    }
    const t = window.setTimeout(speak, 1200);
    return () => window.clearTimeout(t);
  }, [prefs.language, prefs.voiceSpeed, profile.displayName, strings]);

  return null;
}
