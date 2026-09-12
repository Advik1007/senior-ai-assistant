"use client";

import {
  AlertTriangle,
  CalendarDays,
  HelpCircle,
  MapPin,
  Mic,
  Phone,
  Settings,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { DailyGreeting } from "@/components/DailyGreeting";
import { TodayReminders } from "@/components/TodayReminders";
import { useApp } from "@/components/providers/app-provider";

const tile = "min-h-[4.25rem] text-lg sm:text-xl";

export default function HomePage() {
  const { strings } = useApp();

  return (
    <AppShell showBack={false} title={strings.tagline}>
      <DailyGreeting />
      <TodayReminders />

      <BigButton
        href="/talk"
        tone="gold"
        className="min-h-[5rem] text-2xl"
        icon={<Mic className="size-7" />}
      >
        {strings.talk}
      </BigButton>

      <BigButton
        href="/family"
        tone="call"
        className={tile}
        icon={<Phone className="size-6" />}
      >
        {strings.callFamily}
      </BigButton>

      <div className="grid grid-cols-2 gap-2.5">
        <BigButton
          href="/help"
          tone="help"
          className={tile}
          icon={<HelpCircle className="size-6" />}
        >
          {strings.help}
        </BigButton>
        <BigButton
          href="/shopping"
          tone="service"
          className={tile}
          icon={<ShoppingBag className="size-6" />}
        >
          {strings.shopping}
        </BigButton>
        <BigButton
          href="/medical"
          tone="service"
          className={tile}
          icon={<Stethoscope className="size-6" />}
        >
          {strings.medical}
        </BigButton>
        <BigButton
          href="/routine"
          tone="primary"
          className={tile}
          icon={<CalendarDays className="size-6" />}
        >
          {strings.routine}
        </BigButton>
        <BigButton
          href="/directions"
          tone="service"
          className={tile}
          icon={<MapPin className="size-6" />}
        >
          {strings.directions}
        </BigButton>
        <BigButton
          href="/settings"
          tone="muted"
          className={tile}
          icon={<Settings className="size-6" />}
        >
          {strings.settings}
        </BigButton>
      </div>

      <BigButton
        href="/emergency"
        tone="help"
        className="min-h-14 text-lg"
        icon={<AlertTriangle className="size-6" />}
      >
        {strings.emergency}
      </BigButton>
    </AppShell>
  );
}
