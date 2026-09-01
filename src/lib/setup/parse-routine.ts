import type { RoutineItem } from "@/lib/storage/routines";

export type ParsedRoutineItem = Omit<RoutineItem, "id">;

function inferMeridiem(segment: string, hour: number, meridiem?: string): string | undefined {
  if (meridiem) return meridiem;
  const lower = segment.toLowerCase();
  if (/wake|breakfast|morning|नाश्ता|સવાર|उठ/i.test(lower) && hour <= 11) return "am";
  if (/sleep|dinner|walk|evening|night|medicine|दवा|વોક|સૂ/i.test(lower)) {
    if (hour >= 1 && hour <= 11) return "pm";
  }
  if (hour >= 7 && hour <= 11) return "am";
  if (hour >= 1 && hour <= 6) return "pm";
  return undefined;
}

function normalizeTime(hour: number, minute: number, meridiem?: string): string {
  let h = hour;
  const m = minute;
  const mer = meridiem?.toLowerCase();
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (mer === "बजे" || mer === "વાગ્યે") {
    if (h >= 1 && h <= 6) h += 12;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function titleFromSegment(segment: string, timeMatch: string): string {
  let title = segment
    .replace(timeMatch, "")
    .replace(/\b(at|around|by)\b/gi, "")
    .replace(/\b(i|have|my|the|a|an)\b/gi, "")
    .trim();
  title = title.replace(/^[,.\s]+|[,.\s]+$/g, "");
  if (!title) return "Activity";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function parseRoutineSpeech(text: string): ParsedRoutineItem[] {
  const segments = text
    .split(/[,;]|\band\b|और|અને/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  const items: ParsedRoutineItem[] = [];

  for (const segment of segments) {
    const timeRe =
      /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|बजे|વાગ્યે)?/i;
    const match = segment.match(timeRe);
    if (!match) continue;

    const hour = Number.parseInt(match[1], 10);
    const minute = match[2] ? Number.parseInt(match[2], 10) : 0;
    const meridiem = inferMeridiem(segment, hour, match[3]);
    const time = normalizeTime(hour, minute, meridiem);
    const title = titleFromSegment(segment, match[0]);

    const lower = segment.toLowerCase();
    let kind: ParsedRoutineItem["kind"] = "task";
    if (/medicine|medic|दवा|દવા|tablet|pill/i.test(lower)) kind = "medicine";
    if (/walk|exercise|योग|વોક/i.test(lower)) kind = "task";
    if (/wake|sleep|breakfast|lunch|dinner|नाश्ता|સવાર/i.test(lower))
      kind = "task";

    items.push({
      title,
      time,
      days: "daily",
      kind,
    });
  }

  return items.sort((a, b) => a.time.localeCompare(b.time));
}

export function formatRoutineTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  const mer = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${mer}`;
}
