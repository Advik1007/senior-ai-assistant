import type { AppLanguage } from "@/lib/languages";
import type { TranslationCatalog } from "@/lib/i18n/types";
import { STATIC_CATALOGS } from "@/lib/i18n/locales";

/**
 * Bundled static UI catalogs only — no runtime translation APIs.
 * English is the master; other languages ship pre-translated inside the app.
 */
export const CATALOGS: Record<AppLanguage, TranslationCatalog> = STATIC_CATALOGS;
