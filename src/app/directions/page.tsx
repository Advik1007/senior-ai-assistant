"use client";

import { ExternalLink, Mic } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import { doctorsNearMeUrl } from "@/lib/maps";

export default function DirectionsPage() {
  const { strings } = useApp();

  return (
    <AppShell title={strings.directionsTitle}>
      <p className="text-xl leading-relaxed">{strings.directionsIntro}</p>

      <BigButton href="/talk" tone="primary" icon={<Mic className="size-8" />}>
        {strings.directionsAskUnk}
      </BigButton>

      <BigButton
        href={doctorsNearMeUrl()}
        tone="service"
        icon={<ExternalLink className="size-8" />}
      >
        {strings.directionsDoctors}
      </BigButton>

      <p className="rounded-2xl bg-[#FFF4CC] p-4 text-lg font-semibold">
        {strings.directionsIntro}
      </p>
    </AppShell>
  );
}
