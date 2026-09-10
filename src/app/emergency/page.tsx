"use client";

import { Flame, Phone, Siren } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";

export default function EmergencyPage() {
  const { strings } = useApp();

  return (
    <AppShell title={strings.emergencyTitle}>
      <p className="text-lg font-semibold leading-relaxed text-[#C62828]">
        {strings.emergencyIntro}
      </p>

      <BigButton
        href="tel:108"
        tone="call"
        className="min-h-24 text-2xl"
        icon={<Siren className="size-8" />}
      >
        {strings.emergencyAmbulance}
      </BigButton>

      <BigButton
        href="tel:100"
        tone="help"
        className="min-h-24 text-2xl"
        icon={<Phone className="size-8" />}
      >
        {strings.emergencyPolice}
      </BigButton>

      <BigButton
        href="tel:101"
        tone="service"
        className="min-h-24 text-2xl"
        icon={<Flame className="size-8" />}
      >
        {strings.emergencyFire}
      </BigButton>

      <BigButton href="tel:112" tone="muted" className="min-h-16 text-xl">
        {strings.emergencyUniversal}
      </BigButton>

      <p className="text-base text-[#5A6B7D]">{strings.emergencyNote}</p>
    </AppShell>
  );
}
