"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loadMedicalProfile,
  saveMedicalProfile,
  type MedicineReminder,
} from "@/lib/storage/medical-profile";

export default function MedicalMedicinesPage() {
  const { strings } = useApp();
  const [profile, setProfile] = useState(loadMedicalProfile);
  const [saved, setSaved] = useState(false);

  function updateMedicine(id: string, patch: Partial<MedicineReminder>) {
    setProfile({
      ...profile,
      medicines: profile.medicines.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    });
  }

  function addMedicine() {
    setProfile({
      ...profile,
      medicines: [
        ...profile.medicines,
        {
          id: crypto.randomUUID(),
          name: "",
          dose: "",
          time: "",
          days: strings.medicalDaily,
        },
      ],
    });
  }

  function save() {
    saveMedicalProfile(profile);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell title={strings.medicalMedicines}>
      <p className="text-xl">{strings.medicalMedicinesHint}</p>

      {profile.medicines.map((med) => (
        <section
          key={med.id}
          className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black"
        >
          <Label className="text-lg">{strings.medicalMedicineName}</Label>
          <Input
            value={med.name}
            onChange={(e) => updateMedicine(med.id, { name: e.target.value })}
            className="mt-1 h-14 rounded-xl border-2 text-xl"
          />
          <Label className="mt-3 text-lg">{strings.medicalDose}</Label>
          <Input
            value={med.dose}
            onChange={(e) => updateMedicine(med.id, { dose: e.target.value })}
            className="mt-1 h-14 rounded-xl border-2 text-xl"
          />
          <Label className="mt-3 text-lg">{strings.medicalTime}</Label>
          <Input
            type="time"
            value={med.time}
            onChange={(e) => updateMedicine(med.id, { time: e.target.value })}
            className="mt-1 h-14 rounded-xl border-2 text-xl"
          />
          <Label className="mt-3 text-lg">{strings.medicalDays}</Label>
          <Input
            value={med.days}
            onChange={(e) => updateMedicine(med.id, { days: e.target.value })}
            className="mt-1 h-14 rounded-xl border-2 text-xl"
          />
        </section>
      ))}

      <BigButton tone="muted" onClick={addMedicine}>
        {strings.medicalAddMedicine}
      </BigButton>
      <BigButton tone="call" onClick={save}>
        {saved ? strings.saved : strings.save}
      </BigButton>
    </AppShell>
  );
}
