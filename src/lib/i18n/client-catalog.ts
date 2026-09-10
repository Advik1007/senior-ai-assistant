import { catalogToNested, type AppStrings } from "@/lib/i18n/nested";
import { I18N_CATALOG_VERSION } from "@/lib/i18n/catalog-version";
import type { TranslationCatalog } from "@/lib/i18n/types";
import type { AppLanguage } from "@/lib/languages";

const STORAGE_PREFIX = "unk.i18n.catalog";
export const I18N_READY_EVENT = "unk:i18n-ready";

function storageKey(lang: AppLanguage): string {
  return `${STORAGE_PREFIX}.${I18N_CATALOG_VERSION}.${lang}`;
}

export function readCachedCatalog(lang: AppLanguage): AppStrings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(lang));
    if (!raw) return null;
    const catalog = JSON.parse(raw) as TranslationCatalog;
    return catalogToNested(catalog);
  } catch {
    return null;
  }
}

export function writeCachedCatalog(
  lang: AppLanguage,
  catalog: TranslationCatalog,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(lang), JSON.stringify(catalog));
  } catch {
    /* quota */
  }
}

function notifyCatalogReady(lang: AppLanguage, strings: AppStrings): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(I18N_READY_EVENT, { detail: { lang, strings } }),
  );
}

/** Load Gemini (or English) catalog for a language and cache it. */
export async function fetchLanguageCatalog(
  lang: AppLanguage,
): Promise<AppStrings | null> {
  const res = await fetch(`/api/i18n/catalog?lang=${encodeURIComponent(lang)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    catalog?: TranslationCatalog;
  };
  if (!data.catalog) return null;
  writeCachedCatalog(lang, data.catalog);
  const nested = catalogToNested(data.catalog);
  notifyCatalogReady(lang, nested);
  return nested;
}

/**
 * Ensure the full UI catalog is ready before navigating / switching pages.
 * Uses cache when present; otherwise waits for Gemini translation.
 */
export async function ensureLanguageCatalog(
  lang: AppLanguage,
): Promise<AppStrings | null> {
  if (lang === "en") {
    const next = await fetchLanguageCatalog("en");
    return next ?? readCachedCatalog("en");
  }

  const cached = readCachedCatalog(lang);
  if (cached) {
    notifyCatalogReady(lang, cached);
    // Refresh quietly in the background so strings stay current.
    void fetchLanguageCatalog(lang);
    return cached;
  }

  return fetchLanguageCatalog(lang);
}
