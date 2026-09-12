import type { AppLanguage } from "@/lib/languages";
import type { TranslationCatalog } from "@/lib/i18n/types";
import en from "@/lib/i18n/en";
import hi from "./hi";
import mr from "./mr";
import gu from "./gu";
import bn from "./bn";
import ta from "./ta";
import te from "./te";
import kn from "./kn";

export const STATIC_CATALOGS: Record<AppLanguage, TranslationCatalog> = {
  en,
  hi,
  mr,
  gu,
  bn,
  ta,
  te,
  kn,
};
