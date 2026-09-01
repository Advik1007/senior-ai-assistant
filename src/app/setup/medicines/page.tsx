"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import {
  OnboardingShell,
  onboardingInputClass,
  onboardingLabelClass,
  onboardingMutedTextClass,
} from "@/components/OnboardingShell";
import { SetupVoiceField } from "@/components/setup/SetupVoiceField";
import { SetupStepLabel } from "@/components/setup/SetupStepLabel";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseMedicineSpeech } from "@/lib/setup/parse-medicine";
import { formatRoutineTime } from "@/lib/setup/parse-routine";
import { markSetupStep } from "@/lib/storage/onboarding";
import { addMedicine } from "@/lib/storage/medical-profile";

export default function SetupMedicinesPage() {
  const router = useRouter();
  const { strings, lang } = useApp();
  const [voiceText, setVoiceText] = useState("");
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState(strings.medicalDaily);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<{
    name: string;
    dose: string;
    time: string;
    days: string;
    notes: string;
  } | null>(null);

  function goComplete() {
    markSetupStep("complete");
    router.push("/setup/complete");
  }

  function understand() {
    const parsed = parseMedicineSpeech(voiceText);
    if (parsed) {
      setPending(parsed);
      setName(parsed.name);
      setDose(parsed.dose);
      setTime(parsed.time);
      setDays(parsed.days);
      setNotes(parsed.notes);
      return;
    }
    if (name.trim() && time) {
      setPending({ name: name.trim(), dose, time, days, notes });
    }
  }

  function savePending() {
    if (!pending) return;
    addMedicine({
      name: pending.name,
      dose: pending.dose,
      time: pending.time,
      days: pending.days,
      notes: pending.notes,
    });
    setPending(null);
    setName("");
    setDose("");
    setTime("");
    setNotes("");
    setVoiceText("");
  }

  const displayTime = pending?.time
    ? formatRoutineTime(pending.time)
    : time
      ? formatRoutineTime(time)
      : "";

  return (
    <OnboardingShell
      lang={lang}
      title={strings.setupMedicinesTitle}
      subtitle={strings.setupMedicinesSubtitle}
      tagline={strings.tagline}
    >
      <SetupStepLabel step={3} label={strings.setupStepMedicines} />

      <p className={onboardingMutedTextClass}>
        {strings.setupMedicinesVoicePlaceholder}
      </p>

      <SetupVoiceField
        lang={lang}
        value={voiceText}
        onChange={setVoiceText}
        onSubmit={understand}
        placeholder={strings.setupMedicinesVoicePlaceholder}
        listenLabel={strings.setupMedicinesListen}
        stopLabel={strings.setupMedicinesStop}
        sendLabel={strings.setupMedicinesSend}
      />

      <div className="space-y-4 rounded-xl border-2 border-[#0B1F3A]/10 p-4">
        <div>
          <Label className={onboardingLabelClass}>{strings.setupMedicinesName}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 ${onboardingInputClass}`}
          />
        </div>
        <div>
          <Label className={onboardingLabelClass}>{strings.setupMedicinesDose}</Label>
          <Input
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="Before food / After food"
            className={`mt-1 ${onboardingInputClass}`}
          />
        </div>
        <div>
          <Label className={onboardingLabelClass}>{strings.setupMedicinesTime}</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`mt-1 ${onboardingInputClass}`}
          />
        </div>
        <div>
          <Label className={onboardingLabelClass}>{strings.setupMedicinesDays}</Label>
          <Input
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className={`mt-1 ${onboardingInputClass}`}
          />
        </div>
        <div>
          <Label className={onboardingLabelClass}>{strings.setupMedicinesNotes}</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`mt-1 ${onboardingInputClass}`}
          />
        </div>
      </div>

      {pending ? (
        <div className="rounded-xl border-2 border-[#0B4F8A]/30 bg-[#eef4fa] p-5">
          <p className="text-xl font-bold">{strings.setupMedicinesConfirmTitle}</p>
          <p className="mt-2 text-lg">
            {strings.setupMedicinesConfirmBody(pending.name, displayTime)}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <BigButton tone="call" onClick={savePending}>
              {strings.setupMedicinesConfirmYes}
            </BigButton>
            <BigButton tone="muted" onClick={() => setPending(null)}>
              {strings.setupMedicinesConfirmNo}
            </BigButton>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pt-2">
        <BigButton tone="primary" onClick={understand}>
          {strings.setupMedicinesAdd}
        </BigButton>
        <BigButton tone="muted" onClick={goComplete}>
          {strings.setupMedicinesSkip}
        </BigButton>
      </div>
    </OnboardingShell>
  );
}
