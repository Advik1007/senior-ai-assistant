import type { TranslationCatalog } from "@/lib/i18n/types";
import en from "@/lib/i18n/en";
import { ur as legacy } from "@/lib/i18n/regional";
import { AI_I18N } from "@/lib/i18n/ai-i18n";

const ur: TranslationCatalog = { ...en, ...legacy, ...AI_I18N.ur };
export default ur;
