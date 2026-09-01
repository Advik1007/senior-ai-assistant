"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import { OnboardingShell, onboardingMutedTextClass } from "@/components/OnboardingShell";
import { SetupVoiceField } from "@/components/setup/SetupVoiceField";
import { SetupStepLabel } from "@/components/setup/SetupStepLabel";
import { useApp } from "@/components/providers/app-provider";
import {
  formatRoutineTime,
  parseRoutineSpeech,
  type ParsedRoutineItem,
} from "@/lib/setup/parse-routine";
import { markSetupStep } from "@/lib/storage/onboarding";
import { replaceRoutines } from "@/lib/storage/routines";

export default function SetupRoutinePage() {
  const router = useRouter();
  const { strings, lang } = useApp();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedRoutineItem[] | null>(null);
  const [editing, setEditing] = useState(false);

  function understand() {
    const items = parseRoutineSpeech(text);
    if (items.length === 0) {
      setParsed(null);
      return;
    }
    setParsed(items);
    setEditing(false);
  }

  function saveRoutine() {
    if (!parsed?.length) return;
    replaceRoutines(parsed);
    markSetupStep("medicines");
    router.push("/setup/medicines");
  }

  function skipRoutine() {
    markSetupStep("medicines");
    router.push("/setup/medicines");
  }

  return (
    <OnboardingShell
      lang={lang}
      title={strings.setupRoutineTitle}
      subtitle={strings.setupRoutineSubtitle}
      tagline={strings.tagline}
    >
      <SetupStepLabel step={2} label={strings.setupStepRoutine} />

      <SetupVoiceField
        lang={lang}
        value={text}
        onChange={setText}
        onSubmit={understand}
        placeholder={strings.setupRoutineVoicePlaceholder}
        listenLabel={strings.setupRoutineListen}
        stopLabel={strings.setupRoutineStop}
        sendLabel={strings.setupRoutineSend}
      />

      {parsed && parsed.length > 0 && !editing ? (
        <div className="rounded-xl border-2 border-[#0B1F3A]/15 bg-white p-5">
          <h2 className="text-2xl font-extrabold">{strings.setupRoutineYourRoutine}</h2>
          <ul className="mt-4 space-y-3 text-xl">
            {parsed.map((item, i) => (
              <li key={`${item.time}-${item.title}-${i}`}>
                <strong>{formatRoutineTime(item.time)}</strong> — {item.title}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xl font-bold">{strings.setupRoutineLookRight}</p>
          <div className="mt-4 flex flex-col gap-3">
            <BigButton tone="call" onClick={saveRoutine}>
              {strings.setupRoutineConfirm}
            </BigButton>
            <BigButton
              tone="muted"
              onClick={() => {
                setEditing(true);
                setParsed(null);
              }}
            >
              {strings.setupRoutineEdit}
            </BigButton>
          </div>
        </div>
      ) : null}

      {parsed === null && text.trim() && !editing ? (
        <p className={onboardingMutedTextClass}>{strings.setupRoutineEmpty}</p>
      ) : null}

      {!parsed?.length ? (
        <div className="flex flex-col gap-3">
          <BigButton tone="muted" onClick={understand}>
            {strings.setupRoutineSend}
          </BigButton>
          <BigButton tone="muted" onClick={skipRoutine}>
            {strings.setupRoutineSkip}
          </BigButton>
        </div>
      ) : null}
    </OnboardingShell>
  );
}
