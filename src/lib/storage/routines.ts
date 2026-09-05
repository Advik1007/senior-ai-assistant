import { readJson, writeJson } from "@/lib/storage/local-store";

const KEY = "unk.routines";

export type RoutineItem = {
  id: string;
  title: string;
  time: string;
  days: string;
  /** One-off calendar date as YYYY-MM-DD */
  date?: string;
  notes?: string;
  kind: "reminder" | "medicine" | "appointment" | "task";
};

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function loadRoutines(): RoutineItem[] {
  return readJson<RoutineItem[]>(KEY, []);
}

export function saveRoutines(items: RoutineItem[]): void {
  writeJson(KEY, items);
}

export function replaceRoutines(
  items: Omit<RoutineItem, "id">[],
): RoutineItem[] {
  const next = items.map((item) => ({ ...item, id: crypto.randomUUID() }));
  saveRoutines(next);
  return next;
}

export function addRoutine(item: Omit<RoutineItem, "id">): RoutineItem[] {
  const next = [
    ...loadRoutines(),
    { ...item, id: crypto.randomUUID() },
  ];
  saveRoutines(next);
  return next;
}

export function removeRoutine(id: string): RoutineItem[] {
  const next = loadRoutines().filter((r) => r.id !== id);
  saveRoutines(next);
  return next;
}

/** Dated one-offs for a specific calendar day. */
export function eventsForDay(
  items: RoutineItem[],
  dateKey: string,
): RoutineItem[] {
  return items
    .filter((r) => r.date === dateKey)
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Count of dated events per day in a month (1–31). */
export function eventCountsInMonth(
  items: RoutineItem[],
  year: number,
  monthIndex: number,
): Record<number, number> {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
  const counts: Record<number, number> = {};
  for (const r of items) {
    if (!r.date?.startsWith(prefix)) continue;
    const day = Number(r.date.slice(8, 10));
    if (!Number.isFinite(day)) continue;
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
}

/** Recurring / undated items (no calendar date). */
export function recurringItems(items: RoutineItem[]): RoutineItem[] {
  return items.filter((r) => !r.date);
}

export function isTodayKey(dateKey: string): boolean {
  return dateKey === toDateKey(new Date());
}
