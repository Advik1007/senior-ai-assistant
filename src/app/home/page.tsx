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

const compact =
  "min-h-12 shrink-0 gap-2 rounded-xl px-3 py-2 text-lg sm:min-h-14 sm:text-xl";

export default function HomePage() {
  const { strings } = useApp();

  return (
    <AppShell showBack={false} title={strings.tagline}>
      <DailyGreeting />

      <BigButton
        href="/talk"
        tone="primary"
        className={compact}
        icon={<Mic className="size-6" />}
      >
        {strings.talk}
      </BigButton>

      <BigButton
        href="/help"
        tone="help"
        className={compact}
        icon={<HelpCircle className="size-6" />}
      >
        {strings.help}
      </BigButton>

      <BigButton
        href="/shopping"
        tone="service"
        className={compact}
        icon={<ShoppingBag className="size-6" />}
      >
        {strings.shopping}
      </BigButton>

      <BigButton
        href="/medical"
        tone="help"
        className={compact}
        icon={<Stethoscope className="size-6" />}
      >
        {strings.medical}
      </BigButton>

      <BigButton
        href="/routine"
        tone="call"
        className={compact}
        icon={<CalendarDays className="size-6" />}
      >
        {strings.routine}
      </BigButton>

      <BigButton
        href="/directions"
        tone="service"
        className={compact}
        icon={<MapPin className="size-6" />}
      >
        {strings.directions}
      </BigButton>

      <BigButton
        href="/emergency"
        tone="call"
        className={`${compact} border-red-600 bg-red-600 text-white`}
        icon={<AlertTriangle className="size-6" />}
      >
        {strings.emergency}
      </BigButton>

      <BigButton
        href="/settings"
        tone="muted"
        className={compact}
        icon={<Settings className="size-6" />}
      >
        {strings.settings}
      </BigButton>
    </AppShell>
  );
}
