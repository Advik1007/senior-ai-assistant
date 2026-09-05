import type { MedicineReminder } from "@/lib/storage/medical-profile";
import type { RoutineItem } from "@/lib/storage/routines";
import { toDateKey } from "@/lib/storage/routines";
import { formatRoutineTime } from "@/lib/setup/parse-routine";

const GREETING_KEY = "unk.lastGreetingDate";

export function greetingStorageKey(): string {
  return GREETING_KEY;
}

export function shouldGreetToday(): boolean {
  if (typeof window === "undefined") return false;
  const today = toDateKey(new Date());
  return localStorage.getItem(GREETING_KEY) !== today;
}

export function markGreetedToday(): void {
  if (typeof window === "undefined") return;
  const today = toDateKey(new Date());
  localStorage.setItem(GREETING_KEY, today);
}

type GreetingParts = {
  timeLabel: string;
  items: Array<{ label: string; time: string }>;
};

function timeOfDayGreeting(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function collectTodayItems(
  routines: RoutineItem[],
  medicines: MedicineReminder[],
): GreetingParts["items"] {
  const items: GreetingParts["items"] = [];
  const today = toDateKey(new Date());

  for (const r of routines) {
    if (r.date) {
      if (r.date === today) {
        items.push({ label: r.title, time: r.time || "00:00" });
      }
      continue;
    }
    if (r.days === "once") continue;
    items.push({ label: r.title, time: r.time });
  }

  for (const m of medicines) {
    if (!m.time) continue;
    items.push({ label: m.name || "Medicine", time: m.time });
  }

  return items.sort((a, b) => a.time.localeCompare(b.time));
}

export function buildDailyGreeting(
  name: string,
  routines: RoutineItem[],
  medicines: MedicineReminder[],
  templates: {
    morning: (n: string) => string;
    afternoon: (n: string) => string;
    evening: (n: string) => string;
    item: (label: string, time: string) => string;
    none: (n: string) => string;
  },
): string {
  const hour = new Date().getHours();
  const part = timeOfDayGreeting(hour);
  const intro =
    part === "morning"
      ? templates.morning(name)
      : part === "afternoon"
        ? templates.afternoon(name)
        : templates.evening(name);

  const items = collectTodayItems(routines, medicines);
  if (items.length === 0) return templates.none(name);

  const list = items
    .slice(0, 6)
    .map((i) => templates.item(i.label, formatRoutineTime(i.time)))
    .join(", ");

  return `${intro} ${list}.`;
}
