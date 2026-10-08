const LEAD_IN =
  /^(?:please\s+)?(?:(?:i\s+)?(?:want|need|would like)(?:\s+to)?\s+)?(?:order|buy|get|find|search(?:\s+for)?|check|compare|show(?:\s+me)?)?\s*/i;

const FILLER = /\b(?:please|some|a|an|the|for me|from blinkit|from instamart|on blinkit|on instamart)\b/gi;

/** "I want milk, bread and 6 eggs" → ["milk", "bread", "6 eggs"]. Max 5 items. */
export function parseGroceryList(text: string): string[] {
  const cleaned = text.trim().replace(LEAD_IN, "");
  const parts = cleaned
    .split(/\s*(?:,|;|\n|\band\b|&|\+|\baur\b|और)\s*/i)
    .map((p) => p.replace(FILLER, " ").replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 1);

  const seen = new Set<string>();
  const items: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(p);
    if (items.length === 5) break;
  }
  return items;
}
