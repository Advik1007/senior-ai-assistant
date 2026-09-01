import type { Relationship } from "@/lib/db/schema";

export type ParsedContact = {
  name: string;
  relationship: Relationship;
  phoneNumber: string;
};

const RELATIONSHIP_WORDS: Record<string, Relationship> = {
  son: "son",
  daughter: "daughter",
  brother: "brother",
  sister: "sister",
  spouse: "spouse",
  husband: "spouse",
  wife: "spouse",
  grandchild: "grandchild",
  friend: "friend",
  caregiver: "caregiver",
  other: "other",
  बेटा: "son",
  बेटी: "daughter",
  पत्नी: "spouse",
  पति: "spouse",
  दोस्त: "friend",
  મારો: "son",
  દીકરો: "son",
  દીકરી: "daughter",
  પતિ: "spouse",
  પત્ની: "spouse",
  મિત્ર: "friend",
};

function matchRelationship(text: string): Relationship | null {
  const lower = text.toLowerCase();
  for (const [word, rel] of Object.entries(RELATIONSHIP_WORDS)) {
    if (lower.includes(word)) return rel;
  }
  if (/\bmy\s+(son|daughter|spouse|friend|brother|sister)\b/i.test(text)) {
    const m = text.match(/\bmy\s+(son|daughter|spouse|friend|brother|sister|caregiver)\b/i);
    if (m?.[1]) return RELATIONSHIP_WORDS[m[1].toLowerCase()] ?? "other";
  }
  return null;
}

function extractPhone(text: string): string {
  const labeled =
    text.match(
      /(?:number is|phone is|mobile is|नंबर|નંબર)\s*([+\d][\d\s-]{8,})/i,
    )?.[1] ?? "";
  if (labeled) return labeled.replace(/\s/g, "");
  const digits = text.match(/(\+?\d[\d\s-]{9,})/);
  return digits?.[1]?.replace(/\s/g, "") ?? "";
}

function extractName(text: string): string {
  const addMatch = text.match(
    /add\s+([a-zA-Z\u0900-\u097F\u0A80-\u0AFF]+)\s+as/i,
  );
  if (addMatch?.[1]) return addMatch[1].trim();

  const callMatch = text.match(
    /(?:call|name is)\s+([a-zA-Z\u0900-\u097F\u0A80-\u0AFF]+)/i,
  );
  if (callMatch?.[1]) return callMatch[1].trim();

  const words = text.split(/\s+/).filter((w) => w.length > 1 && !/\d/.test(w));
  return words[0] ?? "";
}

export function parseContactSpeech(text: string): ParsedContact | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const relationship = matchRelationship(trimmed);
  const name = extractName(trimmed);
  const phoneNumber = extractPhone(trimmed);

  if (!name || !relationship) return null;

  return { name, relationship, phoneNumber };
}
