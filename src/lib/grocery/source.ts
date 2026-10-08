"use client";

import { currentPosition } from "@/lib/blinkit";
import { sampleLines } from "@/lib/grocery/mock";
import { parseGroceryList } from "@/lib/grocery/parse";
import type {
  GroceryLine,
  GroceryOffer,
  GrocerySearchResult,
  PlatformId,
} from "@/lib/grocery/types";

/** Set NEXT_PUBLIC_GROCERY_MOCK=1 to always use sample data (no API credits used). */
const FORCE_SAMPLE = process.env.NEXT_PUBLIC_GROCERY_MOCK === "1";

/**
 * Single entry point for the grocery screen and the voice agent.
 * Uses live QuickCommerce prices when available, otherwise clearly-labelled sample prices.
 */
export async function searchGroceries(
  text: string,
  options: { sample?: boolean } = {},
): Promise<GrocerySearchResult> {
  const items = parseGroceryList(text);
  if (!items.length) return { lines: [], source: "sample" };

  if (FORCE_SAMPLE || options.sample) {
    return { lines: sampleLines(items), source: "sample" };
  }

  const pos = await currentPosition();
  if (!pos) {
    return { lines: sampleLines(items), source: "sample", notice: "no-location" };
  }

  try {
    const params = new URLSearchParams({
      items: items.join(","),
      lat: String(pos.lat),
      lon: String(pos.lon),
    });
    const res = await fetch(`/api/grocery/search?${params}`);
    if (res.status === 503) {
      return { lines: sampleLines(items), source: "sample", notice: "no-key" };
    }
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { lines?: GroceryLine[] };
    return { lines: data.lines ?? [], source: "live" };
  } catch {
    return { lines: sampleLines(items), source: "sample", notice: "offline" };
  }
}

export function bestOffer(line: GroceryLine): GroceryOffer | null {
  return line.offers[0] ?? null;
}

export function grandTotal(lines: GroceryLine[]): number {
  return lines.reduce((sum, line) => sum + (bestOffer(line)?.price ?? 0), 0);
}

/** Cost of buying the whole list from one store (cheapest match per item on that store). */
export function storeTotals(
  lines: GroceryLine[],
): Array<{ platform: PlatformId; total: number; found: number }> {
  const totals = new Map<PlatformId, { total: number; found: number }>();
  for (const line of lines) {
    const seen = new Set<PlatformId>();
    for (const offer of line.offers) {
      if (seen.has(offer.platform)) continue;
      seen.add(offer.platform);
      const t = totals.get(offer.platform) ?? { total: 0, found: 0 };
      t.total += offer.price;
      t.found += 1;
      totals.set(offer.platform, t);
    }
  }
  return [...totals.entries()]
    .map(([platform, t]) => ({ platform, ...t }))
    .sort((a, b) => b.found - a.found || a.total - b.total);
}

export function formatRupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Short sentence the voice agent reads back after a search. */
export function spokenSummary(result: GrocerySearchResult): string {
  if (!result.lines.length) return "I could not understand the grocery list. Please say the items again.";
  const parts = result.lines.map((line) => {
    const best = bestOffer(line);
    if (!best) return `${line.query} was not found`;
    const store = best.platform === "blinkit" ? "Blinkit" : "Instamart";
    return `${line.query} is ${formatRupees(best.price)} on ${store}${best.eta ? `, ${best.eta}` : ""}`;
  });
  const total = formatRupees(grandTotal(result.lines));
  const sample = result.source === "sample" ? " These are sample prices." : "";
  return `${parts.join(". ")}. The total is ${total}.${sample} The cards are on the screen; tap Open to finish in the app.`;
}
