"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Contact } from "@/lib/db/schema";
import {
  clearMemory,
  deleteMemoryFact,
  isMemoryEnabled,
  loadMemory,
  setMemoryEnabled,
} from "@/lib/ai/memory";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LANGUAGES } from "@/lib/languages";
import { getBookingHistorySnapshot } from "@/lib/storage/bookings";
import { subscribeStore } from "@/lib/storage/store-events";
import {
  restartOnboardingFromLanguage,
  restartSetupWizard,
} from "@/lib/storage/onboarding";
import { addContact, removeContact } from "@/lib/storage/contacts";
import { hasUsablePhoneNumber } from "@/lib/phone";
import { logoutSession } from "@/lib/auth/client-session";

const EMPTY_HISTORY: import("@/lib/db/schema").BookingRecord[] = [];

export default function SettingsPage() {
  const router = useRouter();
  const {
    prefs,
    setPrefs,
    profile,
    setProfile,
    contacts,
    setContacts,
    strings,
    logout,
    sessionUser,
    completeLogin,
  } = useApp();
  const history = useSyncExternalStore(
    subscribeStore,
    getBookingHistorySnapshot,
    () => EMPTY_HISTORY,
  );
  const [saved, setSaved] = useState(false);
  const [memoryOn, setMemoryOn] = useState(true);
  const [memories, setMemories] = useState<string[]>([]);
  // Local drafts — avoid emitStore/full-tree re-render on every keystroke.
  const [draftName, setDraftName] = useState(profile.displayName);
  const [draftPhone, setDraftPhone] = useState(profile.phone);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    setDraftName(profile.displayName);
    setDraftPhone(profile.phone);
    setDraftEmail(profile.email);
  }, [profile.displayName, profile.phone, profile.email]);

  useEffect(() => {
    setMemoryOn(isMemoryEnabled());
    setMemories(loadMemory());
  }, []);

  function addFamilyNumber() {
    const name = newName.trim();
    const phoneNumber = newPhone.trim();
    if (!name || !hasUsablePhoneNumber(phoneNumber)) return;
    const next = addContact({
      name,
      relationship: "other",
      phoneNumber,
      isTrusted: true,
    });
    setContacts(next);
    setNewName("");
    setNewPhone("");
  }

  function updateContact(id: string, patch: Partial<Contact>) {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function commitProfile(patch: Partial<typeof profile>) {
    setProfile({ ...profile, ...patch });
  }

  function saveAll() {
    commitProfile({
      displayName: draftName,
      phone: draftPhone,
      email: draftEmail,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell title={strings.settingsTitle}>
      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-3 text-2xl font-extrabold">{strings.yourName}</h2>
        <Label htmlFor="displayName" className="text-lg">
          {strings.yourName}
        </Label>
        <Input
          id="displayName"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={() => commitProfile({ displayName: draftName })}
          className="mt-1 h-14 rounded-xl border-2 text-xl md:text-xl"
        />
        <Label htmlFor="userPhone" className="mt-4 text-lg">
          {strings.phone}
        </Label>
        <Input
          id="userPhone"
          type="tel"
          inputMode="tel"
          placeholder="+91"
          value={draftPhone}
          onChange={(e) => setDraftPhone(e.target.value)}
          onBlur={() => commitProfile({ phone: draftPhone })}
          className="mt-1 h-14 rounded-xl border-2 text-xl md:text-xl"
        />
        <Label htmlFor="email" className="mt-4 text-lg">
          {strings.email}
        </Label>
        <Input
          id="email"
          type="email"
          value={draftEmail}
          onChange={(e) => setDraftEmail(e.target.value)}
          onBlur={() => commitProfile({ email: draftEmail })}
          className="mt-1 h-14 rounded-xl border-2 text-xl md:text-xl"
        />
      </section>

      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-4 text-2xl font-extrabold">{strings.textSize}</h2>
        <div className="flex flex-col gap-3">
          {(
            [
              ["large", strings.textLarge],
              ["extra-large", strings.textExtraLarge],
              ["biggest", strings.textBiggest],
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

      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-4 text-2xl font-extrabold">{strings.language}</h2>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <BigButton
              key={lang.code}
              tone={prefs.language === lang.code ? "primary" : "muted"}
              onClick={() => {
                setPrefs({ ...prefs, language: lang.code });
                setProfile({
                  ...profile,
                  preferredLanguage: lang.code,
                });
                if (sessionUser) {
                  void import("@/lib/auth/client-session").then(
                    ({ persistAccountLanguage }) => {
                      void persistAccountLanguage(lang.code).then((user) => {
                        if (user) completeLogin(user);
                      });
                    },
                  );
                }
              }}
            >
              {lang.nativeLabel}
            </BigButton>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
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

      <section className="space-y-6 rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
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

      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-4 text-2xl font-extrabold">{strings.manageFamily}</h2>
        <div className="mb-6 space-y-3">
          <Label className="text-lg">{strings.name}</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-14 rounded-xl border-2 text-xl md:text-xl"
          />
          <Label className="text-lg">{strings.phone}</Label>
          <Input
            type="tel"
            inputMode="tel"
            placeholder="+91"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="h-14 rounded-xl border-2 text-xl md:text-xl"
          />
          <BigButton tone="call" onClick={addFamilyNumber}>
            {strings.setupContactsAdd}
          </BigButton>
        </div>
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
              <BigButton
                tone="muted"
                className="mt-3"
                onClick={() => setContacts(removeContact(contact.id))}
              >
                {strings.routineRemove}
              </BigButton>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-2 text-2xl font-extrabold">{strings.memoryTitle}</h2>
        <p className="mb-4 text-lg">{strings.memoryHint}</p>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="memory" className="text-xl font-bold">
            {strings.memoryEnabled}
          </Label>
          <Switch
            id="memory"
            checked={memoryOn}
            onCheckedChange={(on) => {
              setMemoryEnabled(on);
              setMemoryOn(on);
            }}
            className="h-10 w-16 scale-125"
          />
        </div>
        <h3 className="mb-2 mt-6 text-xl font-bold">{strings.memoryView}</h3>
        {memories.length === 0 ? (
          <p className="text-lg">{strings.memoryEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {memories.map((fact) => (
              <li
                key={fact}
                className="flex flex-col gap-2 rounded-2xl border-2 border-[#0B1F3A]/20 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-lg">{fact}</span>
                <BigButton
                  tone="muted"
                  className="min-h-14 text-lg"
                  onClick={() => setMemories(deleteMemoryFact(fact))}
                >
                  {strings.memoryDelete}
                </BigButton>
              </li>
            ))}
          </ul>
        )}
        <BigButton
          tone="help"
          className="mt-4"
          onClick={() => {
            clearMemory();
            setMemories([]);
          }}
        >
          {strings.memoryClear}
        </BigButton>
      </section>

      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <h2 className="mb-3 text-2xl font-extrabold">{strings.bookingHistory}</h2>
        {history.length === 0 ? (
          <p className="text-xl">{strings.bookingEmpty}</p>
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

      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <BigButton
          tone="primary"
          onClick={() => {
            restartSetupWizard();
            router.push("/setup/contacts");
          }}
        >
          {strings.settingsRestartSetup}
        </BigButton>
        <BigButton
          tone="muted"
          className="mt-3"
          onClick={() => {
            void (async () => {
              await logoutSession();
              restartOnboardingFromLanguage();
              window.location.href = "/start";
            })();
          }}
        >
          {strings.settingsRestartLanguage}
        </BigButton>
      </section>

      <section className="rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 high-contrast:border-white high-contrast:bg-black">
        <BigButton tone="help" onClick={() => void logout()}>
          {strings.authLogout}
        </BigButton>
      </section>
    </AppShell>
  );
}
