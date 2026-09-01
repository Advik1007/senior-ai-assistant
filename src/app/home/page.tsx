"use client";

import {
  AlertTriangle,
  CalendarDays,
  HelpCircle,
  MapPin,
  Mic,
  Settings,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { DailyGreeting } from "@/components/DailyGreeting";
import { useApp } from "@/components/providers/app-provider";

export default function HomePage() {
  const { strings } = useApp();

  return (
    <AppShell showBack={false} title={strings.tagline}>
      <DailyGreeting />

      <BigButton href="/talk" tone="primary" icon={<Mic className="size-8" />}>
        {strings.talk}
      </BigButton>

      <BigButton
        href="/help"
        tone="help"
        className="min-h-28 text-3xl"
        icon={<HelpCircle className="size-10" />}
      >
        {strings.help}
      </BigButton>

      <BigButton href="/shopping" tone="service" icon={<ShoppingBag className="size-8" />}>
        {strings.shopping}
      </BigButton>

      <BigButton href="/medical" tone="help" icon={<Stethoscope className="size-8" />}>
        {strings.medical}
      </BigButton>

      <BigButton href="/routine" tone="call" icon={<CalendarDays className="size-8" />}>
        {strings.routine}
      </BigButton>

      <BigButton href="/directions" tone="service" icon={<MapPin className="size-8" />}>
        {strings.directions}
      </BigButton>

      <BigButton
        href="/emergency"
        tone="call"
        className="min-h-28 border-red-600 bg-red-600 text-white"
        icon={<AlertTriangle className="size-10" />}
      >
        {strings.emergency}
      </BigButton>

      <BigButton href="/settings" tone="muted" icon={<Settings className="size-8" />}>
        {strings.settings}
      </BigButton>
    </AppShell>
  );
}
