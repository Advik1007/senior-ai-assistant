import type { BookingRecord } from "@/lib/db/schema";
import { readJson, writeJson } from "@/lib/storage/local-store";
import { emitStore } from "@/lib/storage/store-events";

const KEY = "unk.booking-history";
const EMPTY: BookingRecord[] = [];

let cache: BookingRecord[] | null = null;

export function getBookingHistorySnapshot(): BookingRecord[] {
  if (typeof window === "undefined") return EMPTY;
  if (!cache) cache = readJson<BookingRecord[]>(KEY, EMPTY);
  return cache;
}

export function saveBookingRecord(record: BookingRecord): void {
  const next = [
    record,
    ...getBookingHistorySnapshot().filter((item) => item.id !== record.id),
  ].slice(0, 40);
  cache = next;
  writeJson(KEY, next);
  emitStore();
}

/**
 * Confirmed is only allowed when the provider returned an id.
 * This helper refuses to write a fake confirmation.
 */
export function markBookingConfirmed(
  id: string,
  confirmationId: string,
): void {
  if (!confirmationId.trim()) {
    throw new Error("Cannot mark booked without a provider confirmation id.");
  }
  const current = getBookingHistorySnapshot().find((item) => item.id === id);
  if (!current) return;
  saveBookingRecord({
    ...current,
    status: "confirmed",
    providerConfirmationId: confirmationId,
  });
}
