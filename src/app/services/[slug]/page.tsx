"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/providers/app-provider";
import { billService } from "@/lib/services/bills";
import { bloodTestService } from "@/lib/services/blood-test";
import { cabService } from "@/lib/services/cab";
import { flightService } from "@/lib/services/flight";
import { nurseService } from "@/lib/services/nurse";
import type { BookingProvider } from "@/lib/services/types";

const SERVICES: Record<
  string,
  {
    titleKey: "bookCab" | "bookFlight" | "payBills" | "bookNurse" | "bookBloodTest";
    provider: BookingProvider;
    medical?: boolean;
  }
> = {
  cab: { titleKey: "bookCab", provider: cabService },
  flight: { titleKey: "bookFlight", provider: flightService },
  bills: { titleKey: "payBills", provider: billService },
  nurse: { titleKey: "bookNurse", provider: nurseService, medical: true },
  "blood-test": {
    titleKey: "bookBloodTest",
    provider: bloodTestService,
    medical: true,
  },
};

export default function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { strings } = useApp();
  const service = SERVICES[slug];

  if (!service) {
    notFound();
  }

  return (
    <AppShell title={strings[service.titleKey]}>
      <div className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-5 text-xl leading-relaxed high-contrast:border-white high-contrast:bg-black">
        <p className="mb-4 text-2xl font-extrabold">API connection required</p>
        <p className="mb-4">{strings.serviceApiRequired}</p>
        <p className="mb-4">
          Service: <strong>{service.provider.serviceName}</strong>
        </p>
        <p className="mb-4">
          Status:{" "}
          <strong>{service.provider.status.replaceAll("_", " ")}</strong>
        </p>
        {service.medical ? <p className="mb-4">{strings.notMedicalAdvice}</p> : null}
        <p>{strings.neverAutoPay}</p>
      </div>
    </AppShell>
  );
}
