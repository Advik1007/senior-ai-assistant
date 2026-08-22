"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import type { Contact } from "@/lib/db/schema";
import { hasUsablePhoneNumber, startPhoneCall } from "@/lib/phone";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { ConfirmCallDialog } from "@/components/ConfirmCallDialog";
import { useApp } from "@/components/providers/app-provider";

export default function FamilyPage() {
  const { contacts, strings } = useApp();
  const [pending, setPending] = useState<Contact | null>(null);

  function onCall(contact: Contact) {
    if (!hasUsablePhoneNumber(contact.phoneNumber)) return;
    startPhoneCall(contact.phoneNumber);
    setPending(null);
  }

  return (
    <AppShell title={strings.familyTitle}>
      <p className="text-xl">{strings.familyHint}</p>

      {contacts.map((contact) => {
        const ready = hasUsablePhoneNumber(contact.phoneNumber);
        return (
          <article
            key={contact.id}
            className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black"
          >
            <p className="text-lg font-bold uppercase tracking-wide text-[#0B4F8A] high-contrast:text-[#FFD60A]">
              {strings.relationship[contact.relationship]}
            </p>
            <h2 className="text-3xl font-extrabold">{contact.name}</h2>
            <p className="mb-3 text-xl">
              {ready ? contact.phoneNumber : strings.noPhone}
            </p>
            {ready ? (
              <BigButton
                tone="call"
                icon={<Phone className="size-8" />}
                onClick={() => setPending(contact)}
              >
                {strings.callName(contact.name)}
              </BigButton>
            ) : (
              <BigButton href="/settings" tone="muted">
                {strings.addNumber}
              </BigButton>
            )}
          </article>
        );
      })}

      <ConfirmCallDialog
        contact={pending}
        onClose={() => setPending(null)}
        onConfirm={onCall}
      />
    </AppShell>
  );
}
