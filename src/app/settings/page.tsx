"use client";

import { useState, useSyncExternalStore } from "react";
import type { Contact } from "@/lib/db/schema";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getBookingHistorySnapshot } from "@/lib/storage/bookings";
import { subscribeStore } from "@/lib/storage/store-events";

const EMPTY_HISTORY: import("@/lib/db/schema").BookingRecord[] = [];

export default function SettingsPage() {
  const { prefs, setPrefs, profile, setProfile, contacts, setContacts, strings } =
    useApp();
  const history = useSyncExternalStore(
    subscribeStore,
    getBookingHistorySnapshot,
    () => EMPTY_HISTORY,
  );
  const [saved, setSaved] = useState(false);

  function updateContact(id: string, patch: Partial<Contact>) {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function saveAll() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell title={strings.settingsTitle}>
      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-3 text-2xl font-extrabold">{strings.yourName}</h2>
        <Label htmlFor="displayName" className="text-lg">
          {strings.yourName}
        </Label>
        <Input
          id="displayName"
          value={profile.displayName}
          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
          className="mt-1 h-14 rounded-xl border-2 text-xl md:text-xl"
        />
        <Label htmlFor="email" className="mt-4 text-lg">
          {strings.email}
        </Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          className="mt-1 h-14 rounded-xl border-2 text-xl md:text-xl"
        />
      </section>

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-4 text-2xl font-extrabold">{strings.textSize}</h2>
        <div className="flex flex-col gap-3">
          {(
            [
              ["large", "Large"],
              ["extra-large", "Extra large"],
              ["biggest", "Biggest"],
            ] as const
          ).map(([value, label]) => (
            <BigButton
              key={value}
              tone={prefs.textSize === value ? "primary" : "muted"}
              onClick={() => setPrefs({ ...prefs, textSize: value })}
            >
              {label}
            </BigButton>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-4 text-2xl font-extrabold">{strings.language}</h2>
        <div className="flex flex-col gap-3">
          <BigButton
            tone={prefs.language === "en" ? "primary" : "muted"}
            onClick={() => setPrefs({ ...prefs, language: "en" })}
          >
            English
          </BigButton>
          <BigButton
            tone={prefs.language === "hi" ? "primary" : "muted"}
            onClick={() => setPrefs({ ...prefs, language: "hi" })}
          >
            हिन्दी
          </BigButton>
        </div>
      </section>

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-4 text-2xl font-extrabold">{strings.voiceSpeed}</h2>
        <div className="flex flex-col gap-3">
          <BigButton
            tone={prefs.voiceSpeed <= 0.8 ? "primary" : "muted"}
            onClick={() => setPrefs({ ...prefs, voiceSpeed: 0.75 })}
          >
            {strings.slow}
          </BigButton>
          <BigButton
            tone={prefs.voiceSpeed > 0.8 ? "primary" : "muted"}
            onClick={() => setPrefs({ ...prefs, voiceSpeed: 1 })}
          >
            {strings.normal}
          </BigButton>
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="contrast" className="text-2xl font-bold">
            {strings.highContrast}
          </Label>
          <Switch
            id="contrast"
            checked={prefs.highContrast}
            onCheckedChange={(highContrast) => setPrefs({ ...prefs, highContrast })}
            className="h-10 w-16 scale-125"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="a11y" className="text-2xl font-bold">
            {strings.accessibilityMode}
          </Label>
          <Switch
            id="a11y"
            checked={prefs.accessibilityMode}
            onCheckedChange={(accessibilityMode) =>
              setPrefs({ ...prefs, accessibilityMode })
            }
            className="h-10 w-16 scale-125"
          />
        </div>
      </section>

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-4 text-2xl font-extrabold">{strings.manageFamily}</h2>
        <div className="flex flex-col gap-6">
          {contacts.map((contact) => (
            <div key={contact.id} className="border-t-2 border-[#0B1F3A]/20 pt-4 first:border-t-0 first:pt-0">
              <p className="mb-2 text-lg font-bold uppercase">
                {strings.relationship[contact.relationship]}
              </p>
              <Label className="text-lg">{strings.name}</Label>
              <Input
                value={contact.name}
                onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                className="mt-1 h-14 rounded-xl border-2 text-xl md:text-xl"
              />
              <Label className="mt-3 text-lg">{strings.phone}</Label>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="+91"
                value={contact.phoneNumber}
                onChange={(e) =>
                  updateContact(contact.id, { phoneNumber: e.target.value })
                }
                className="mt-1 h-14 rounded-xl border-2 text-xl md:text-xl"
              />
              <label className="mt-3 flex items-center justify-between gap-3 text-xl font-semibold">
                {strings.manageTrusted}
                <Switch
                  checked={contact.isTrusted}
                  onCheckedChange={(isTrusted) =>
                    updateContact(contact.id, { isTrusted })
                  }
                  className="h-10 w-16 scale-125"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-3 text-2xl font-extrabold">Booking history</h2>
        {history.length === 0 ? (
          <p className="text-xl">No requests yet. Confirmed bookings will appear only after a real company API accepts them.</p>
        ) : (
          <ul className="space-y-3 text-xl">
            {history.map((item) => (
              <li key={item.id}>
                <strong>{item.kind.replace("_", " ")}</strong> — {item.status}
                <br />
                {item.summary}
              </li>
            ))}
          </ul>
        )}
      </section>

      <BigButton tone="call" onClick={saveAll}>
        {saved ? strings.saved : strings.save}
      </BigButton>
    </AppShell>
  );
}
