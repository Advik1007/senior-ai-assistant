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
import ml from "./ml";
import pa from "./pa";
import ur from "./ur";
import or from "./or";
import as from "./as";
import ne from "./ne";

export const STATIC_CATALOGS: Record<AppLanguage, TranslationCatalog> = {
  en,
  hi,
  mr,
  gu,
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
};
