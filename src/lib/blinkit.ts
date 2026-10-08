import { aiPhrase } from "@/lib/ai/phrases";
import type { AppLanguage } from "@/lib/languages";

export const BLINKIT_HOME = "https://blinkit.com";

export function blinkitReply(lang: AppLanguage, item: string): string {
  if (lang === "hi") {
    return item
      ? `Blinkit पर ${item} खोल रहा हूँ। भुगतान आप खुद करें।`
      : "Blinkit खोल रहा हूँ। भुगतान आप खुद करें।";
  }
  if (lang !== "en") return aiPhrase(lang, "ai.shopping");
  return item
    ? `Opening Blinkit for ${item}. Please check the order and pay yourself.`
    : "Opening Blinkit. Please check the order and pay yourself.";
}

export function blinkitSearchUrl(item?: string): string {
  const q = item?.trim();
  return q ? `${BLINKIT_HOME}/s/?q=${encodeURIComponent(q)}` : BLINKIT_HOME;
}

const ORDER_EN =
  /\b(?:order|buy|purchase|get me|bring me|deliver)\s+(?:me\s+)?(?:some\s+|a\s+|an\s+|the\s+)?(.+?)(?:\s+(?:from|on|via|through)\s+blinkit)?[\s.!?]*$/i;
const ORDER_HI = /^(.+?)\s+(?:मंगवा|मँगवा|मंगा|ऑर्डर|खरीद)/;

/**
 * Returns the item to search on Blinkit ("" means just open Blinkit),
 * or null when the sentence is not an order request.
 */
export function extractOrderItem(raw: string): string | null {
  const text = raw.trim();
  if (!text || /\bin order to\b/i.test(text)) return null;

  const en = text.match(ORDER_EN);
  if (en?.[1]) {
    return en[1]
      .replace(/\b(?:please|for me|right now|now|today|quickly)\b/gi, "")
      .replace(/\b(?:from|on|via|through)\s+blinkit\b/gi, "")
      .replace(/^(?:a\s+)?(?:packet|pack|bottle|box)s?\s+of\s+/i, "")
      .replace(/[\s.!?,]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  const hi = text.match(ORDER_HI);
  if (hi?.[1]) return hi[1].replace(/^(?:मुझे|मेरे लिए)\s+/, "").trim();

  if (/blinkit/i.test(text)) return "";
  return null;
}

export function openBlinkit(item?: string): void {
  openExternal(blinkitSearchUrl(item));
}

export function openExternal(url: string): void {
  if (typeof window === "undefined") return;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = url;
}

export type BlinkitProduct = {
  id: string;
  name: string;
  brand: string | null;
  quantity: string;
  price: number | null;
  mrp: number | null;
  image: string | null;
  link: string;
  eta: string | null;
};

export function currentPosition(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60_000 },
    );
  });
}

/** Live Blinkit results near the user; empty when location or the API is unavailable. */
export async function searchBlinkitNearby(item: string): Promise<BlinkitProduct[]> {
  const q = item.trim();
  if (!q) return [];
  const pos = await currentPosition();
  if (!pos) return [];
  try {
    const params = new URLSearchParams({
      q,
      lat: String(pos.lat),
      lon: String(pos.lon),
    });
    const res = await fetch(`/api/blinkit/search?${params}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: BlinkitProduct[] };
    return data.products ?? [];
  } catch {
    return [];
  }
}

export function blinkitFoundReply(
  lang: AppLanguage,
  item: string,
  top: BlinkitProduct,
): string {
  const price = top.price != null ? `₹${top.price}` : "";
  const eta = top.eta ?? "";
  if (lang === "hi") {
    return `Blinkit पर ${top.name} ${top.quantity} ${price} में मिला${eta ? `, ${eta} में डिलीवरी` : ""}। ऑर्डर करने के लिए नीचे दबाएँ।`;
  }
  return `On Blinkit I found ${top.name}, ${top.quantity}${price ? ` for ${price}` : ""}${eta ? `, delivered in ${eta}` : ""}. Tap it below to order your ${item}.`;
}
