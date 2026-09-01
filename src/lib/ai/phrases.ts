import type { AppLanguage } from "@/lib/languages";
import { CATALOGS } from "@/lib/i18n/catalogs";
import type { TranslationKey } from "@/lib/i18n/types";

/** Localized Command AI phrases used for speech and local fallbacks. */
export function aiPhrase(
  lang: AppLanguage,
  key: TranslationKey,
  vars?: Record<string, string>,
): string {
  const catalog = CATALOGS[lang] ?? CATALOGS.en;
  let text = catalog[key] ?? CATALOGS.en[key] ?? "";
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v);
    }
  }
  return text;
}
