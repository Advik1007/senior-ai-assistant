import type { Contact } from "@/lib/db/schema";
import { readJson, writeJson } from "@/lib/storage/local-store";
import { emitStore } from "@/lib/storage/store-events";

const KEY = "unk.family-contacts";

/** Starter family list. Phone numbers are empty until the user adds them. */
export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "son",
    name: "Rahul",
    relationship: "son",
    phoneNumber: "",
    isTrusted: true,
  },
  {
    id: "daughter",
    name: "Priya",
    relationship: "daughter",
    phoneNumber: "",
    isTrusted: true,
  },
  {
    id: "brother",
    name: "Amit",
    relationship: "brother",
    phoneNumber: "",
    isTrusted: false,
  },
  {
    id: "sister",
    name: "Anjali",
    relationship: "sister",
    phoneNumber: "",
    isTrusted: false,
  },
];

let cache: Contact[] | null = null;

export function getContactsSnapshot(): Contact[] {
  if (typeof window === "undefined") return DEFAULT_CONTACTS;
  if (!cache) {
    const saved = readJson<Contact[] | null>(KEY, null);
    cache = !saved || saved.length === 0 ? DEFAULT_CONTACTS : saved;
  }
  return cache;
}

export function loadContacts(): Contact[] {
  return getContactsSnapshot();
}

export function saveContacts(contacts: Contact[]): void {
  cache = contacts;
  writeJson(KEY, contacts);
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
