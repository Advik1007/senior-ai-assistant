import type { MedicineReminder } from "@/lib/storage/medical-profile";
import { loadMedicalProfile } from "@/lib/storage/medical-profile";
import type { RoutineItem } from "@/lib/storage/routines";
import { loadRoutines, parseDateKey } from "@/lib/storage/routines";

export const REMINDER_APP_TITLE = "UNK AI";

export type ReminderPlan = {
  key: string;
  body: string;
  hour: number;
  minute: number;
  /** One-shot fire time. Omit for a daily repeat. */
  at?: Date;
  route: string;
};

/** Phone shade text: "REMINDER SLEEP". */
export function reminderBody(label: string): string {
  const text = label.trim().replace(/\s+/g, " ");
  if (!text) return "REMINDER";
  return `REMINDER ${text.toUpperCase()}`;
}

export function parseClockToHm(
  time: string,
): { hour: number; minute: number } | null {
  const raw = time.trim().toLowerCase();
  if (!raw || !/\d/.test(raw)) return null;
  if (/anytime|any time|whenever/.test(raw)) return null;

  const ampm = /\b(am|pm)\b/.exec(raw)?.[1];
  const hm = /(\d{1,2})(?::(\d{2}))?/.exec(raw);
  if (!hm) return null;

  let hour = Number.parseInt(hm[1], 10);
  const minute = hm[2] ? Number.parseInt(hm[2], 10) : 0;
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (minute < 0 || minute > 59) return null;

  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  if (hour === 24) hour = 0;
  if (hour < 0 || hour > 23) return null;
  return { hour, minute };
}

export function notificationIdForKey(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const id = (hash >>> 0) % 2147483646;
  return id === 0 ? 1 : id;
}

function clockForItem(
  time: string,
  fallbackHour?: number,
): { hour: number; minute: number } | null {
  return parseClockToHm(time) ?? (fallbackHour === undefined
    ? null
    : { hour: fallbackHour, minute: 0 });
}

function atDate(
  dateKey: string,
  hour: number,
  minute: number,
  now: Date,
): Date | null {
  const day = parseDateKey(dateKey);
  if (!day) return null;
  const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
  if (at.getTime() <= now.getTime()) return null;
  return at;
}

export function buildReminderPlans(
  routines: RoutineItem[],
  medicines: MedicineReminder[],
  now = new Date(),
): ReminderPlan[] {
  const plans: ReminderPlan[] = [];

  for (const item of routines) {
    const clock = clockForItem(item.time, item.date ? 9 : undefined);
    if (!clock) continue;
    const title = item.title.trim();
    if (!title) continue;

    if (item.date) {
      const at = atDate(item.date, clock.hour, clock.minute, now);
      if (!at) continue;
      plans.push({
        key: `r:${item.id}`,
        body: reminderBody(title),
        hour: clock.hour,
        minute: clock.minute,
        at,
        route: "/routine",
      });
      continue;
    }

    if (/^once$/i.test((item.days ?? "").trim())) {
      const at = nextOccurrence(clock.hour, clock.minute, now);
      plans.push({
        key: `r:${item.id}`,
        body: reminderBody(title),
        hour: clock.hour,
        minute: clock.minute,
        at,
        route: "/routine",
      });
      continue;
    }

    plans.push({
      key: `r:${item.id}`,
      body: reminderBody(title),
      hour: clock.hour,
      minute: clock.minute,
      route: "/routine",
    });
  }

  for (const med of medicines) {
    const clock = parseClockToHm(med.time);
    if (!clock) continue;
    const name = med.name.trim() || "MEDICINE";
    plans.push({
      key: `m:${med.id}`,
      body: reminderBody(name),
      hour: clock.hour,
      minute: clock.minute,
      route: "/medical/medicines",
    });
  }

  return plans;
}

function nextOccurrence(hour: number, minute: number, now: Date): Date {
  const at = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0,
  );
  if (at.getTime() <= now.getTime()) {
    at.setDate(at.getDate() + 1);
  }
  return at;
}

let syncTimer: number | undefined;
let syncing = false;
let syncAgain = false;

export function queueReminderSync(): void {
  if (typeof window === "undefined") return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    void syncReminders();
  }, 250);
}

export async function syncReminders(): Promise<void> {
  if (typeof window === "undefined") return;
  if (syncing) {
    syncAgain = true;
    return;
  }
  syncing = true;
  try {
    do {
      syncAgain = false;
      await syncRemindersNow();
    } while (syncAgain);
  } catch {
    // Old APKs or browsers without the native plugin must not crash the app.
  } finally {
    syncing = false;
  }
}

async function syncRemindersNow(): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  if (!Capacitor.isPluginAvailable("LocalNotifications")) return;

  const { LocalNotifications } = await import(
    "@capacitor/local-notifications"
  );

  const plans = buildReminderPlans(
    loadRoutines(),
    loadMedicalProfile().medicines,
  );

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }

  if (plans.length === 0) return;

  let status = await LocalNotifications.checkPermissions();
  if (status.display !== "granted") {
    status = await LocalNotifications.requestPermissions();
  }
  if (status.display !== "granted") return;

  await LocalNotifications.schedule({
    notifications: plans.map((plan) => ({
      id: notificationIdForKey(plan.key),
      title: REMINDER_APP_TITLE,
      body: plan.body,
      largeBody: plan.body,
      extra: { route: plan.route, key: plan.key },
      group: "unk-reminders",
      autoCancel: true,
      schedule: plan.at
        ? { at: plan.at, allowWhileIdle: true }
        : {
            on: { hour: plan.hour, minute: plan.minute, second: 0 },
            allowWhileIdle: true,
          },
    })),
  });
}

export function extraRoute(extra: unknown): string | null {
  if (!extra || typeof extra !== "object") return null;
  const route = (extra as { route?: unknown }).route;
  if (typeof route === "string" && route.startsWith("/")) return route;
  return null;
}
