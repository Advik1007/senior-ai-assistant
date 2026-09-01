"use client";

import { Flame, Phone, Siren } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";

export default function EmergencyPage() {
  const { strings } = useApp();

  return (
    <AppShell title={strings.emergencyTitle}>
      <p className="text-2xl font-bold leading-relaxed text-red-700">
        {strings.emergencyIntro}
      </p>

      <BigButton
        href="tel:108"
        tone="call"
        className="min-h-32 text-3xl"
        icon={<Siren className="size-10" />}
      >
        {strings.emergencyAmbulance}
      </BigButton>

      <BigButton
        href="tel:100"
        tone="help"
        className="min-h-32 text-3xl"
        icon={<Phone className="size-10" />}
      >
        {strings.emergencyPolice}
      </BigButton>

      <BigButton
        href="tel:101"
        tone="service"
        className="min-h-32 text-3xl"
        icon={<Flame className="size-10" />}
      >
        {strings.emergencyFire}
      </BigButton>

      <BigButton href="tel:112" tone="muted" className="min-h-24 text-2xl">
        {strings.emergencyUniversal}
      </BigButton>

      <p className="text-lg opacity-80">{strings.emergencyNote}</p>
    </AppShell>
  );
}
