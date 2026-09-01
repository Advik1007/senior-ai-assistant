"use client";

import { CalendarDays, HeartPulse, Pill, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";

export default function MedicalPage() {
  const { strings } = useApp();

  return (
    <AppShell title={strings.medicalTitle}>
      <p className="text-xl leading-relaxed">{strings.medicalIntro}</p>

      <BigButton href="/doctor" tone="help" icon={<Stethoscope className="size-8" />}>
        {strings.medicalSymptoms}
      </BigButton>

      <BigButton href="/medical/medicines" tone="primary" icon={<Pill className="size-8" />}>
        {strings.medicalMedicines}
      </BigButton>

      <BigButton href="/medical/profile" tone="service" icon={<HeartPulse className="size-8" />}>
        {strings.medicalProfile}
      </BigButton>

      <BigButton href="/doctor?nearby=1" tone="call" icon={<CalendarDays className="size-8" />}>
        {strings.medicalFindDoctor}
      </BigButton>

      <p className="rounded-2xl bg-[#FFF4CC] p-4 text-lg font-semibold">
        {strings.medicalDisclaimer}
      </p>
    </AppShell>
  );
}
