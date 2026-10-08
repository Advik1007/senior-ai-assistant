import { NextResponse } from "next/server";
import {
  PLATFORMS,
  PLATFORM_IDS,
  platformFromApiName,
} from "@/lib/grocery/platforms";
import type { GroceryLine, GroceryOffer } from "@/lib/grocery/types";

export const runtime = "nodejs";

const MAX_ITEMS = 5;
const CACHE_MS = 10 * 60_000;

type RawProduct = {
  id?: string | number;
  name?: string;
  brand?: string | null;
  available?: boolean;
  images?: string[];
  mrp?: number;
  offer_price?: number;
  quantity?: string;
  deeplink?: string;
  platform?: { name?: string; sla?: string };
};

/** Each search costs credits, so identical nearby searches are reused for a while. */
const cache = new Map<string, { at: number; line: GroceryLine }>();

function toOffer(raw: RawProduct, fallbackPlatform: string): GroceryOffer | null {
  const platform = platformFromApiName(raw.platform?.name || fallbackPlatform);
  const price = raw.offer_price ?? raw.mrp;
  if (!platform || !raw.name || price == null || raw.available === false) {
    return null;
  }
  return {
    id: String(raw.id ?? `${platform}-${raw.name}`),
    platform,
    name: raw.name,
    brand: raw.brand ?? null,
    quantity: raw.quantity ?? "",
    price,
    mrp: raw.mrp ?? null,
    image: raw.images?.[0] ?? null,
    eta: raw.platform?.sla ?? null,
    productUrl: raw.deeplink ?? null,
  };
}

async function searchItem(
  apiKey: string,
  query: string,
  lat: number,
  lon: number,
): Promise<GroceryLine> {
  const key = `${query.toLowerCase()}|${lat.toFixed(2)}|${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.line;

  const params = new URLSearchParams({
    q: query,
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    platforms: PLATFORM_IDS.map((id) => PLATFORMS[id].apiName).join(","),
  });
  const res = await fetch(
    `https://api.quickcommerceapi.com/v1/groupsearch?${params}`,
    { headers: { "X-API-Key": apiKey }, cache: "no-store" },
  );
  if (!res.ok) {
    console.error("[grocery-search]", res.status);
    throw new Error(String(res.status));
  }

  const body = (await res.json()) as {
    data?: { results?: Record<string, RawProduct[]> };
  };
  const offers: GroceryOffer[] = [];
  for (const [platformName, products] of Object.entries(body.data?.results ?? {})) {
    // The store's own ranking puts the closest match first.
    const top = (products ?? [])
      .map((p) => toOffer(p, platformName))
      .find((o): o is GroceryOffer => o !== null);
    if (top) offers.push(top);
  }
  offers.sort((a, b) => a.price - b.price);

  const line = { query, offers };
  cache.set(key, { at: Date.now(), line });
  return line;
}

export async function GET(request: Request) {
  const apiKey = process.env.QUICKCOMMERCE_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith("your_")) {
    return NextResponse.json({ message: "unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const items = (url.searchParams.get("items") ?? "")
    .split(",")
    .map((s) => s.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!items.length || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ message: "bad_request" }, { status: 400 });
  }

  try {
    const lines = await Promise.all(
      items.map((q) => searchItem(apiKey, q, lat, lon)),
    );
    return NextResponse.json({ lines });
  } catch {
    return NextResponse.json({ message: "failed" }, { status: 502 });
  }
}
