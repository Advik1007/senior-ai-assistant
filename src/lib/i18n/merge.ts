import type { TranslationCatalog } from "@/lib/i18n/types";

export function mergeCatalog(
  base: TranslationCatalog,
  overrides: Partial<TranslationCatalog>,
): TranslationCatalog {
  return { ...base, ...overrides };
}
