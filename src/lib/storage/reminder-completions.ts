import { readJson, writeJson } from "@/lib/storage/local-store";
import { emitStore } from "@/lib/storage/store-events";

const KEY = "unk.reminder-completions";

export type ReminderKind = "medicine" | "routine";
export type ReminderStatus = "taken" | "skipped";

type DayLog = Record<
  string,
  {
    status: ReminderStatus;
    updatedAt: string;
  }
>;

type Stored = Record<string, DayLog>;

function itemKey(kind: ReminderKind, id: string): string {
  return `${kind}:${id}`;
}

function readAll(): Stored {
  return readJson<Stored>(KEY, {});
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getReminderStatus(
  kind: ReminderKind,
  id: string,
  date = localDateKey(),
): ReminderStatus | null {
  return readAll()[date]?.[itemKey(kind, id)]?.status ?? null;
}

export function setReminderStatus(
  kind: ReminderKind,
  id: string,
  status: ReminderStatus,
  date = localDateKey(),
): void {
  const all = readAll();
  const day = all[date] ?? {};
  day[itemKey(kind, id)] = {
    status,
    updatedAt: new Date().toISOString(),
  };
  all[date] = day;
  writeJson(KEY, all);
  emitStore();
}
