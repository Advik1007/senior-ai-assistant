import type { Contact } from "@/lib/db/schema";
import { hasUsablePhoneNumber } from "@/lib/phone";
import { readJson, writeJson } from "@/lib/storage/local-store";
import { emitStore } from "@/lib/storage/store-events";

const KEY = "unk.family-contacts";

/** Old placeholder people shipped in earlier builds. Never show these. */
const STARTER_IDS = new Set(["son", "daughter", "brother", "sister"]);
const STARTER_NAMES = new Set(["rahul", "priya", "amit", "anjali"]);

/** Empty until the user adds a real contact with a phone number. */
export const DEFAULT_CONTACTS: Contact[] = [];

export function keepAddedContacts(contacts: Contact[]): Contact[] {
  return contacts.filter((contact) => {
    if (STARTER_IDS.has(contact.id)) return false;
    if (STARTER_NAMES.has(contact.name.trim().toLowerCase())) return false;
    return hasUsablePhoneNumber(contact.phoneNumber);
  });
}

let cache: Contact[] | null = null;

export function getContactsSnapshot(): Contact[] {
  if (typeof window === "undefined") return DEFAULT_CONTACTS;
  if (!cache) {
    const saved = readJson<Contact[] | null>(KEY, null) ?? [];
    const kept = keepAddedContacts(saved);
    cache = kept;
    if (JSON.stringify(saved) !== JSON.stringify(kept)) {
      writeJson(KEY, kept);
    }
  }
  return cache;
}

export function loadContacts(): Contact[] {
  return getContactsSnapshot();
}

export function saveContacts(contacts: Contact[]): void {
  cache = keepAddedContacts(contacts);
  writeJson(KEY, cache);
  emitStore();
}

export function addContact(
  contact: Omit<Contact, "id"> & { id?: string },
): Contact[] {
  const next = [
    ...loadContacts(),
    {
      ...contact,
      id: contact.id ?? crypto.randomUUID(),
    },
  ];
  saveContacts(next);
  return loadContacts();
}

export function removeContact(id: string): Contact[] {
  const next = loadContacts().filter((c) => c.id !== id);
  saveContacts(next);
  return next;
}

export function findContactByRelationship(
  contacts: Contact[],
  relationship: string,
): Contact | undefined {
  const key = relationship.trim().toLowerCase();
  return contacts.find((c) => c.relationship === key);
}

export function findContactByName(
  contacts: Contact[],
  name: string,
): Contact | undefined {
  const key = name.trim().toLowerCase();
  return contacts.find((c) => c.name.toLowerCase() === key);
}
