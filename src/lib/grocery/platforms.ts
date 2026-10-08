import type { PlatformId } from "@/lib/grocery/types";

export type PlatformInfo = {
  id: PlatformId;
  label: string;
  /** Platform name expected by QuickCommerce API. */
  apiName: string;
  androidPackage: string;
  /** Brand colour for the store badge. */
  color: string;
  textColor: string;
  searchUrl: (query: string) => string;
};

export const PLATFORMS: Record<PlatformId, PlatformInfo> = {
  blinkit: {
    id: "blinkit",
    label: "Blinkit",
    apiName: "BlinkIt",
    androidPackage: "com.grofers.customerapp",
    color: "#F8CB46",
    textColor: "#1F1F1F",
    searchUrl: (q) =>
      q.trim()
        ? `https://blinkit.com/s/?q=${encodeURIComponent(q.trim())}`
        : "https://blinkit.com",
  },
  instamart: {
    id: "instamart",
    label: "Instamart",
    apiName: "Swiggy",
    androidPackage: "in.swiggy.android",
    color: "#FC8019",
    textColor: "#FFFFFF",
    searchUrl: (q) =>
      q.trim()
        ? `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(q.trim())}`
        : "https://www.swiggy.com/instamart",
  },
};

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];

export function platformFromApiName(name: string): PlatformId | null {
  const n = name.toLowerCase();
  if (n.includes("blinkit")) return "blinkit";
  if (n.includes("swiggy") || n.includes("instamart")) return "instamart";
  return null;
}