import type { RoutineItem } from "@/lib/storage/routines";
import { toDateKey } from "@/lib/storage/routines";

export type ParsedReminder = {
  title: string;
  date?: string;
  time: string;
  days: string;
  kind: RoutineItem["kind"];
};

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Resolve a day-of-month to YYYY-MM-DD (this month if upcoming, else next). */
export function resolveDayOfMonth(
  day: number,
  now = new Date(),
  monthIndex?: number,
  year?: number,
): string | null {
  if (day < 1 || day > 31) return null;

  if (monthIndex !== undefined) {
    const y = year ?? now.getFullYear();
    const max = daysInMonth(y, monthIndex);
    if (day > max) return null;
    const d = new Date(y, monthIndex, day);
    // If that date already passed this year and month was explicit for past, still use it;
    // if month+day is before today in current year, bump to next year.
    if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      d.setFullYear(d.getFullYear() + 1);
    }
    return toDateKey(d);
  }

  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  if (day >= today && day <= daysInMonth(y, m)) {
    return toDateKey(new Date(y, m, day));
  }
  const nextMonth = m + 1;
  const ny = nextMonth > 11 ? y + 1 : y;
  const nm = nextMonth % 12;
  const max = daysInMonth(ny, nm);
  if (day > max) return null;
  return toDateKey(new Date(ny, nm, day));
}

function extractClockTime(text: string): string | undefined {
  const match = text.match(
    /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  );
  if (!match) return undefined;
  let h = Number(match[1]);
  const min = match[2] ? Number(match[2]) : 0;
  const mer = match[3]?.toLowerCase();
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return undefined;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function stripReminderPhrases(text: string): string {
  return text
    .replace(/\bremind\s+me\s+(?:to\s+)?/gi, "")
    .replace(/\breminder\s+(?:to\s+)?/gi, "")
    .replace(/\bयाद\s*दिला(?:ओ|ना)?\s*/gi, "")
    .replace(/\bon\s+the\s+\d{1,2}(?:st|nd|rd|th)?\b/gi, "")
    .replace(/\bon\s+\d{1,2}(?:st|nd|rd|th)?\b/gi, "")
    .replace(
      /\b(?:on\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
      "",
    )
    .replace(
      /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\b/gi,
      "",
    )
    .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "")
    .replace(/\btomorrow\b/gi, "")
    .replace(/\btoday\b/gi, "")
    .replace(/\bevery\s+\w+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse natural-language reminders like:
 * "remind me on the 25th to go to the doctor"
 * "remind me on March 25 at 10am for checkup"
 */
export function parseReminderSpeech(
  raw: string,
  fallbackTitle = "Reminder",
): ParsedReminder | null {
  const text = raw.trim();
  if (!text) return null;

  const lower = text.toLowerCase();
  const isRemind =
    /\bremind\b|\breminder\b|याद\s*दिला|યાદ\s*અપાવ/i.test(lower);
  if (!isRemind) return null;

  let date: string | undefined;
  const now = new Date();

  // on March 25 / March 25th
  const monthDay = lower.match(
    /\b(?:on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
  );
  if (monthDay) {
    const mi = MONTHS[monthDay[1].toLowerCase()];
    const day = Number(monthDay[2]);
    date = resolveDayOfMonth(day, now, mi) ?? undefined;
  }

  // 25 March
  if (!date) {
    const dayMonth = lower.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\b/i,
    );
    if (dayMonth) {
      const day = Number(dayMonth[1]);
      const mi = MONTHS[dayMonth[2].toLowerCase()];
      date = resolveDayOfMonth(day, now, mi) ?? undefined;
    }
  }

  // on the 25th / on 25th / on 25
  if (!date) {
    const dom = lower.match(/\bon\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (dom) {
      date = resolveDayOfMonth(Number(dom[1]), now) ?? undefined;
    }
  }

  // bare "25th" near remind
  if (!date) {
    const bare = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/);
    if (bare) {
      date = resolveDayOfMonth(Number(bare[1]), now) ?? undefined;
    }
  }

  if (/\btomorrow\b/i.test(lower)) {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    date = toDateKey(t);
  } else if (/\btoday\b/i.test(lower) && !date) {
    date = toDateKey(now);
  }

  const time = extractClockTime(lower) ?? "";
  let title = stripReminderPhrases(text);
  if (!title) title = fallbackTitle;
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const recurring = /\bevery\b/i.test(lower);
  const kind: RoutineItem["kind"] =
    /doctor|clinic|appointment|checkup|check-up|डॉक्टर/i.test(lower)
      ? "appointment"
      : "reminder";

  return {
    title: title.slice(0, 120),
    date: recurring ? undefined : date,
    time,
    days: recurring ? "recurring" : date ? "once" : "once",
    kind,
  };
}

export function formatReminderWhen(parsed: ParsedReminder): string {
  if (parsed.date && parsed.time) return `${parsed.date} ${parsed.time}`;
  if (parsed.date) return parsed.date;
  if (parsed.time) return parsed.time;
  return parsed.days;
}
