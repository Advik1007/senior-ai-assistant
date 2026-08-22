"use client";

import {
  Car,
  HelpCircle,
  Mic,
  Phone,
  Plane,
  Settings,
  Stethoscope,
  Syringe,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";

export default function HomePage() {
  const { strings } = useApp();

  return (
    <AppShell showBack={false} title={strings.tagline}>
      <BigButton href="/talk" tone="primary" icon={<Mic className="size-8" />}>
        {strings.talk}
      </BigButton>

      <BigButton href="/family" tone="call" icon={<Phone className="size-8" />}>
        {strings.callFamily}
      </BigButton>

      <BigButton
        href="/help"
        tone="help"
        className="min-h-28 text-3xl"
        icon={<HelpCircle className="size-10" />}
      >
        {strings.help}
      </BigButton>

      <p className="pt-2 text-xl font-bold">{strings.neverAutoPay}</p>

      <BigButton href="/services/cab" tone="service" icon={<Car className="size-8" />}>
        {strings.bookCab}
      </BigButton>
      <BigButton href="/services/flight" tone="service" icon={<Plane className="size-8" />}>
        {strings.bookFlight}
      </BigButton>
      <BigButton href="/services/bills" tone="service" icon={<Wallet className="size-8" />}>
        {strings.payBills}
      </BigButton>
      <BigButton href="/services/nurse" tone="service" icon={<Stethoscope className="size-8" />}>
        {strings.bookNurse}
      </BigButton>
      <BigButton href="/services/blood-test" tone="service" icon={<Syringe className="size-8" />}>
        {strings.bookBloodTest}
      </BigButton>

      <BigButton href="/settings" tone="muted" icon={<Settings className="size-8" />}>
        {strings.settings}
      </BigButton>
    </AppShell>
  );
}
