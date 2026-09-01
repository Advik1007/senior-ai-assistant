import type { AppLanguage } from "@/lib/languages";
import { CATALOGS } from "@/lib/i18n/catalogs";
import { catalogToNested, type AppStrings } from "@/lib/i18n/nested";

export type { AppStrings };

/** UI strings for the selected language (all 14 UNK AI languages). */
export function t(lang: AppLanguage): AppStrings {
  return catalogToNested(CATALOGS[lang] ?? CATALOGS.en);
}
