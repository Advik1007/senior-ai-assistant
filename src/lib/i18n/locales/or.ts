import type { TranslationCatalog } from "@/lib/i18n/types";
import en from "@/lib/i18n/en";
import { or as legacy } from "@/lib/i18n/regional";
import { AI_I18N } from "@/lib/i18n/ai-i18n";

const or: TranslationCatalog = { ...en, ...legacy, ...AI_I18N.or };
export default or;
