import type { AppLanguage } from "@/lib/languages";
import en from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { mergeCatalog } from "@/lib/i18n/merge";
import { AI_I18N } from "@/lib/i18n/ai-i18n";
import { SETUP_I18N } from "@/lib/i18n/setup-i18n";
import {
  gu,
  mr,
  bn,
  ta,
  te,
  kn,
  ml,
  pa,
  ur,
  or,
  as,
  ne,
} from "@/lib/i18n/regional";
import type { TranslationCatalog } from "@/lib/i18n/types";

function withExtras(lang: AppLanguage, base: TranslationCatalog): TranslationCatalog {
  let next = base;
  const setup = SETUP_I18N[lang];
  if (setup) next = mergeCatalog(next, setup);
  const ai = AI_I18N[lang];
  if (ai) next = mergeCatalog(next, ai);
  return next;
}

export const CATALOGS: Record<AppLanguage, TranslationCatalog> = {
  en,
  hi: withExtras("hi", hi),
  gu: withExtras("gu", gu),
  mr: withExtras("mr", mr),
  bn: withExtras("bn", bn),
  ta: withExtras("ta", ta),
  te: withExtras("te", te),
  kn: withExtras("kn", kn),
  ml: withExtras("ml", ml),
  pa: withExtras("pa", pa),
  ur: withExtras("ur", ur),
  or: withExtras("or", or),
  as: withExtras("as", as),
  ne: withExtras("ne", ne),
};
