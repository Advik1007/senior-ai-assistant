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
      <p className="text-lg text-[#3D4F63]">{strings.familyHint}</p>

      {contacts.length === 0 ? (
        <>
          <p className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 text-lg">
            {strings.noPhone}
          </p>
          <BigButton href="/settings" tone="primary">
            {strings.addNumber}
          </BigButton>
        </>
      ) : null}

      {contacts.map((contact) => {
        const ready = hasUsablePhoneNumber(contact.phoneNumber);
        return (
          <article
            key={contact.id}
            className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black"
          >
            <p className="text-sm font-bold tracking-wide text-[#0B4F8A] uppercase high-contrast:text-[#FFD60A]">
              {strings.relationship[contact.relationship]}
            </p>
            <h2 className="text-2xl font-bold">{contact.name}</h2>
            <p className="mb-3 text-lg text-[#3D4F63]">
              {ready ? contact.phoneNumber : strings.noPhone}
            </p>
            {ready ? (
              <BigButton
                tone="call"
                icon={<Phone className="size-7" />}
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
