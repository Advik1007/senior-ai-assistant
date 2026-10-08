import { NextResponse } from "next/server";
import type { BlinkitProduct } from "@/lib/blinkit";

export const runtime = "nodejs";

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
  platform?: { sla?: string; open?: boolean };
};

export async function GET(request: Request) {
  const apiKey = process.env.QUICKCOMMERCE_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith("your_")) {
    return NextResponse.json({ message: "unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!q || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ message: "bad_request" }, { status: 400 });
  }

  const params = new URLSearchParams({
    q,
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    platform: "BlinkIt",
  });
  const res = await fetch(
    `https://api.quickcommerceapi.com/v1/search?${params}`,
    { headers: { "X-API-Key": apiKey }, cache: "no-store" },
  );
  if (!res.ok) {
    console.error("[quickcommerce]", res.status);
    return NextResponse.json({ message: "failed" }, { status: 502 });
  }

  const body = (await res.json()) as { data?: { products?: RawProduct[] } };
  const products: BlinkitProduct[] = (body.data?.products ?? [])
    .filter((p) => p.available !== false && p.name && p.deeplink)
    .slice(0, 5)
    .map((p) => ({
      id: String(p.id ?? ""),
      name: p.name ?? "",
      brand: p.brand ?? null,
      quantity: p.quantity ?? "",
      price: p.offer_price ?? p.mrp ?? null,
      mrp: p.mrp ?? null,
      image: p.images?.[0] ?? null,
      link: p.deeplink ?? "",
      eta: p.platform?.sla ?? null,
    }));

  return NextResponse.json({ products });
}
