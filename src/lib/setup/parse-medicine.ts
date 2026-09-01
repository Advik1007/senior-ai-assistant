export type ParsedMedicine = {
  name: string;
  dose: string;
  time: string;
  days: string;
  notes: string;
};

function parseTime(text: string): string {
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|बजे|વાગ્યે)?/i);
  if (!match) return "";
  let h = Number.parseInt(match[1], 10);
  const m = match[2] ? Number.parseInt(match[2], 10) : 0;
  const mer = match[3]?.toLowerCase();
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (!mer && h <= 6) h += 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseMedicineSpeech(text: string): ParsedMedicine | null {
  const lower = text.toLowerCase();
  if (!/medicine|medic|tablet|pill|दवा|દવા|remind/i.test(lower)) return null;

  const time = parseTime(text);
  if (!time) return null;

  let name = "Medicine";
  const nameMatch = text.match(
    /take\s+(?:my\s+)?(.+?)\s+(?:every|at|daily)/i,
  );
  if (nameMatch?.[1]) name = nameMatch[1].trim();

  const dose = /before food|after food|with food/i.test(text)
    ? text.match(/(before food|after food|with food)/i)?.[1] ?? ""
    : "";

  const days = /every day|daily|हर दिन|રોજ/i.test(text) ? "daily" : "daily";

  return {
    name,
    dose,
    time,
    days,
    notes: "",
  };
}
