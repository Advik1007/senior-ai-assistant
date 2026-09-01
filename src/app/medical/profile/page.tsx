"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loadMedicalProfile, saveMedicalProfile } from "@/lib/storage/medical-profile";

export default function MedicalProfilePage() {
  const { strings } = useApp();
  const [profile, setProfile] = useState(loadMedicalProfile);
  const [saved, setSaved] = useState(false);

  function save() {
    saveMedicalProfile(profile);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell title={strings.medicalProfile}>
      <p className="text-xl">{strings.medicalProfileHint}</p>

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
        <Label className="text-lg">{strings.medicalConditions}</Label>
        <Textarea
          value={profile.conditions}
          onChange={(e) => setProfile({ ...profile, conditions: e.target.value })}
          className="mt-1 min-h-24 rounded-xl border-2 text-xl"
        />
        <Label className="mt-4 text-lg">{strings.medicalAllergies}</Label>
        <Textarea
          value={profile.allergies}
          onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
          className="mt-1 min-h-24 rounded-xl border-2 text-xl"
        />
        <Label className="mt-4 text-lg">{strings.medicalBloodGroup}</Label>
        <Input
          value={profile.bloodGroup}
          onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
          className="mt-1 h-14 rounded-xl border-2 text-xl"
        />
        <Label className="mt-4 text-lg">{strings.medicalEmergencyNotes}</Label>
        <Textarea
          value={profile.emergencyNotes}
          onChange={(e) =>
            setProfile({ ...profile, emergencyNotes: e.target.value })
          }
          className="mt-1 min-h-24 rounded-xl border-2 text-xl"
        />
      </section>

      <BigButton tone="call" onClick={save}>
        {saved ? strings.saved : strings.save}
      </BigButton>
    </AppShell>
  );
}
