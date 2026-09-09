import type { AppLanguage } from "@/lib/languages";
import { CATALOGS } from "@/lib/i18n/catalogs";
import { catalogToNested, type AppStrings } from "@/lib/i18n/nested";

export type { AppStrings };

const cache = new Map<AppLanguage, AppStrings>();

/** UI strings for the selected language (cached — avoid rebuild on every render). */
export function t(lang: AppLanguage): AppStrings {
  const hit = cache.get(lang);
  if (hit) return hit;
  const next = catalogToNested(CATALOGS[lang] ?? CATALOGS.en);
  cache.set(lang, next);
  return next;
}
