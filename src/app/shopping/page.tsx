"use client";

import { ExternalLink, ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";

const SERVICES = [
  { name: "Blinkit", url: "https://blinkit.com" },
  { name: "Amazon", url: "https://www.amazon.in" },
];

export default function ShoppingPage() {
  const { strings } = useApp();

  return (
    <AppShell title={strings.shoppingTitle}>
      <p className="text-xl leading-relaxed">{strings.shoppingIntro}</p>

      <ol className="list-decimal space-y-3 pl-6 text-xl font-semibold">
        <li>{strings.shoppingStep1}</li>
        <li>{strings.shoppingStep2}</li>
        <li>{strings.shoppingStep3}</li>
        <li>{strings.shoppingStep4}</li>
        <li>{strings.shoppingStep5}</li>
        <li>{strings.shoppingStep6}</li>
        <li>{strings.shoppingStep7}</li>
        <li>{strings.shoppingStep8}</li>
      </ol>

      <p className="rounded-2xl bg-[#FFF4CC] p-4 text-lg font-semibold">
        {strings.shoppingSafety}
      </p>

      <BigButton href="/talk" tone="primary" icon={<ShoppingBag className="size-8" />}>
        {strings.shoppingAskUnk}
      </BigButton>

      {SERVICES.map((service) => (
        <BigButton
          key={service.name}
          href={service.url}
          tone="service"
          icon={<ExternalLink className="size-8" />}
        >
          {service.name}
        </BigButton>
      ))}
    </AppShell>
  );
}
