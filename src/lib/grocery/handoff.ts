"use client";

import { Capacitor } from "@capacitor/core";
import { PLATFORMS } from "@/lib/grocery/platforms";
import type { GroceryOffer, PlatformId } from "@/lib/grocery/types";

function androidIntentUrl(httpsUrl: string, androidPackage: string): string {
  const u = new URL(httpsUrl);
  return (
    `intent://${u.host}${u.pathname}${u.search}` +
    `#Intent;scheme=https;package=${androidPackage};` +
    `S.browser_fallback_url=${encodeURIComponent(httpsUrl)};end`
  );
}

function isNativeShell(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Hand the user over to the store: the installed app when possible,
 * otherwise the store website. UNK never orders or pays.
 */
export function openInStore(platform: PlatformId, url: string): void {
  if (typeof window === "undefined") return;

  // Inside the UNK app, Android routes https store links to the store app via its app links.
  if (!isNativeShell() && /Android/i.test(navigator.userAgent)) {
    window.location.href = androidIntentUrl(url, PLATFORMS[platform].androidPackage);
    return;
  }

  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = url;
}

export function openOffer(offer: GroceryOffer, query: string): void {
  openInStore(
    offer.platform,
    offer.productUrl || PLATFORMS[offer.platform].searchUrl(query),
  );
}
