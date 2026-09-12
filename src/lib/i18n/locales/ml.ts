import type { TranslationCatalog } from "@/lib/i18n/types";
import en from "@/lib/i18n/en";
import { ml as legacy } from "@/lib/i18n/regional";
import { AI_I18N } from "@/lib/i18n/ai-i18n";

const ml: TranslationCatalog = { ...en, ...legacy, ...AI_I18N.ml };
export default ml;
