"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact, Relationship } from "@/lib/db/schema";
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
import { parseContactSpeech } from "@/lib/setup/parse-contact";
import { addContact } from "@/lib/storage/contacts";
import { markSetupStep } from "@/lib/storage/onboarding";

const RELATIONSHIPS: Relationship[] = [
  "son",
  "daughter",
  "spouse",
  "brother",
  "sister",
  "friend",
  "caregiver",
  "grandchild",
  "other",
];

export default function SetupContactsPage() {
  const router = useRouter();
  const { strings, lang, contacts, setContacts, profile, setProfile } = useApp();
  const [userPhone, setUserPhone] = useState(profile.phone);
  const [voiceText, setVoiceText] = useState("");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("son");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState<{
    name: string;
    relationship: Relationship;
    phoneNumber: string;
  } | null>(null);
  const [added, setAdded] = useState<Contact[]>(contacts);

  function goRoutine() {
    setProfile({ ...profile, phone: userPhone.trim() });
    markSetupStep("routine");
    router.push("/setup/routine");
  }

  function applyParsed() {
    const parsed = parseContactSpeech(voiceText || `add ${name} as my ${relationship}`);
    if (parsed) {
      setPending({
        name: parsed.name,
        relationship: parsed.relationship,
        phoneNumber: parsed.phoneNumber || phone,
      });
      return;
    }
    if (name.trim()) {
      setPending({
        name: name.trim(),
        relationship,
        phoneNumber: phone.trim(),
      });
    }
  }

  function savePending() {
    if (!pending) return;
    const next = addContact({
      name: pending.name,
      relationship: pending.relationship,
      phoneNumber: pending.phoneNumber,
      isTrusted: true,
    });
    setContacts(next);
    setAdded(next);
    setPending(null);
    setName("");
    setPhone("");
    setVoiceText("");
  }

  return (
    <OnboardingShell
      lang={lang}
      title={strings.setupContactsTitle}
      subtitle={strings.setupContactsSubtitle}
      tagline={strings.tagline}
    >
      <SetupStepLabel step={1} label={strings.setupStepContacts} />

      <div className="space-y-2 rounded-xl border-2 border-[#0B1F3A]/10 p-4">
        <Label className={onboardingLabelClass}>{strings.setupContactsYourPhone}</Label>
        <Input
          type="tel"
          inputMode="tel"
          placeholder="+91"
          value={userPhone}
          onChange={(e) => setUserPhone(e.target.value)}
          className={onboardingInputClass}
        />
      </div>

      <p className={onboardingMutedTextClass}>{strings.setupContactsVoiceHint}</p>

      <SetupVoiceField
        lang={lang}
        value={voiceText}
        onChange={setVoiceText}
        onSubmit={applyParsed}
        placeholder={strings.setupContactsVoicePlaceholder}
        listenLabel={strings.setupContactsListen}
        stopLabel={strings.setupContactsStop}
        sendLabel={strings.setupContactsSend}
      />

      <div className="space-y-4 rounded-xl border-2 border-[#0B1F3A]/10 p-4">
        <div>
          <Label className={onboardingLabelClass}>{strings.setupContactsName}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 ${onboardingInputClass}`}
          />
        </div>
        <div>
          <Label className={onboardingLabelClass}>
            {strings.setupContactsRelationship}
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {RELATIONSHIPS.map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => setRelationship(rel)}
                className={`rounded-xl border-2 px-4 py-2 text-lg font-semibold ${
                  relationship === rel
                    ? "border-[#0B4F8A] bg-[#0B4F8A] text-white"
                    : "border-[#0B1F3A]/20 bg-white"
                }`}
              >
                {strings.relationship[rel]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className={onboardingLabelClass}>{strings.setupContactsPhone}</Label>
          <Input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`mt-1 ${onboardingInputClass}`}
          />
        </div>
      </div>

      {pending ? (
        <div className="rounded-xl border-2 border-[#0B4F8A]/30 bg-[#eef4fa] p-5">
          <p className="text-xl font-bold">{strings.setupContactsConfirmTitle}</p>
          <p className="mt-2 text-lg">
            {strings.setupContactsConfirmBody(
              pending.name,
              strings.relationship[pending.relationship],
              pending.phoneNumber || "—",
            )}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <BigButton tone="call" onClick={savePending}>
              {strings.setupContactsConfirmYes}
            </BigButton>
            <BigButton tone="muted" onClick={() => setPending(null)}>
              {strings.setupContactsConfirmNo}
            </BigButton>
          </div>
        </div>
      ) : null}

      {added.filter((c) => c.phoneNumber).length > 0 ? (
        <ul className="space-y-2 text-lg">
          {added
            .filter((c) => c.name && c.phoneNumber)
            .map((c) => (
              <li key={c.id}>
                {c.name} — {strings.relationship[c.relationship]} — {c.phoneNumber}
              </li>
            ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-3 pt-2">
        <BigButton tone="primary" onClick={applyParsed}>
          {strings.setupContactsAdd}
        </BigButton>
        <BigButton tone="call" onClick={goRoutine}>
          {strings.setupContactsContinue}
        </BigButton>
        <BigButton tone="muted" onClick={goRoutine}>
          {strings.setupContactsSkip}
        </BigButton>
      </div>
    </OnboardingShell>
  );
}
