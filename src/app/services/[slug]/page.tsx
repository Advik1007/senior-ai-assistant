"use client";

import { Suspense, use } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BookingFlow } from "@/components/BookingFlow";
import { useApp } from "@/components/providers/app-provider";
import { billService } from "@/lib/services/bills";
import { bloodTestService } from "@/lib/services/blood-test";
import { cabService } from "@/lib/services/cab";
import { flightService } from "@/lib/services/flight";
import { nurseService } from "@/lib/services/nurse";
import type { ServiceFlow } from "@/lib/services/flows";

const SERVICES: Record<string, ServiceFlow> = {
  cab: {
    slug: "cab",
    kind: "cab",
    titleKey: "bookCab",
    provider: cabService,
    fields: [
      { key: "pickup", label: "Pickup place", placeholder: "Home" },
      { key: "destination", label: "Where to?", placeholder: "Airport" },
      { key: "when", label: "Date and time", placeholder: "Tomorrow 8:00" },
    ],
  },
  flight: {
    slug: "flight",
    kind: "flight",
    titleKey: "bookFlight",
    provider: flightService,
    fields: [
      { key: "origin", label: "From city" },
      { key: "destination", label: "To city", placeholder: "Delhi" },
      { key: "date", label: "Travel date" },
      { key: "passengers", label: "Number of people", inputMode: "numeric" },
      { key: "preferredTime", label: "Preferred time" },
      { key: "passengerName", label: "Passenger name" },
    ],
  },
  bills: {
    slug: "bills",
    kind: "bill",
    titleKey: "payBills",
    provider: billService,
    fields: [
      { key: "billType", label: "Bill type", placeholder: "electricity or water" },
      { key: "consumerNumber", label: "Consumer / account number", inputMode: "numeric" },
      { key: "mobile", label: "Mobile number", inputMode: "tel" },
    ],
  },
  nurse: {
    slug: "nurse",
    kind: "nurse",
    titleKey: "bookNurse",
    provider: nurseService,
    medical: true,
    fields: [
      { key: "location", label: "Home address" },
      { key: "when", label: "Preferred date and time" },
      { key: "notes", label: "What help do you need?" },
    ],
  },
  "blood-test": {
    slug: "blood-test",
    kind: "blood_test",
    titleKey: "bookBloodTest",
    provider: bloodTestService,
    medical: true,
    fields: [
      { key: "test", label: "Test or package name" },
      { key: "location", label: "City or area" },
      { key: "collection", label: "Home collection or lab" },
      { key: "when", label: "Preferred date and time" },
    ],
  },
};

export default function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { strings } = useApp();
  const flow = SERVICES[slug];
  if (!flow) notFound();

  return (
    <AppShell title={strings[flow.titleKey]}>
      <Suspense fallback={<p className="text-xl">Loading…</p>}>
        <BookingFlow flow={flow} />
      </Suspense>
    </AppShell>
  );
}
