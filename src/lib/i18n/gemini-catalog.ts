import "server-only";

import { completeJsonChat, hasAiApiKey } from "@/lib/ai/provider";
import en from "@/lib/i18n/en";
import { CATALOGS } from "@/lib/i18n/catalogs";
import { I18N_CATALOG_VERSION } from "@/lib/i18n/catalog-version";
import type { TranslationCatalog, TranslationKey } from "@/lib/i18n/types";
import type { AppLanguage } from "@/lib/languages";
import { languageByCode } from "@/lib/languages";

export { I18N_CATALOG_VERSION };
const memoryCache = new Map<string, TranslationCatalog>();

const ALL_KEYS = Object.keys(en) as TranslationKey[];

function cacheKey(lang: AppLanguage): string {
  return `${I18N_CATALOG_VERSION}:${lang}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function translateBatch(
  lang: AppLanguage,
  batch: Partial<Record<TranslationKey, string>>,
): Promise<Partial<Record<TranslationKey, string>>> {
  const meta = languageByCode(lang);
  const raw = await completeJsonChat({
    temperature: 0.15,
    system: `You are a professional UI translator for UNK AI, an accessibility app for older adults in India.

Translate every string value into ${meta.englishName} (${meta.nativeLabel}).
Rules:
- Keep the SAME JSON keys. Return ONLY a JSON object of key → translated string.
- Use natural ${meta.englishName} script. Do not leave English unless the target is English.
- Keep placeholders exactly: {name}, {relationship}, {when}, etc.
- Keep brand name "UNK AI" / "UNK" unchanged.
- Keep tone warm, clear, senior-friendly, short.
- Do not add explanations.`,
    messages: [
      {
        role: "user",
        content: JSON.stringify(batch),
      },
    ],
  });

  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<Record<TranslationKey, string>> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.trim() && key in en) {
        out[key as TranslationKey] = value.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Full UI catalog for any language.
 * English = master strings.
 * Every other language (Hindi, Gujarati, Tamil, …) = Gemini translation of the full English catalog.
 * Falls back to static catalogs if Gemini is unavailable.
 */
export async function getGeminiCatalog(
  lang: AppLanguage,
): Promise<{
  catalog: TranslationCatalog;
  source: "english" | "gemini" | "static-fallback";
}> {
  if (lang === "en") {
    return { catalog: en, source: "english" };
  }

  const hit = memoryCache.get(cacheKey(lang));
  if (hit) {
    return { catalog: hit, source: "gemini" };
  }

  if (!hasAiApiKey()) {
    return { catalog: CATALOGS[lang] ?? en, source: "static-fallback" };
  }

  const merged: TranslationCatalog = { ...en };
  const batches = chunk(ALL_KEYS, 40);
  // Parallel batches — full UI translate finishes much faster on language select.
  const CONCURRENCY = 3;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const slice = batches.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      slice.map(async (keys) => {
        const batch: Partial<Record<TranslationKey, string>> = {};
        for (const key of keys) batch[key] = en[key];
        return translateBatch(lang, batch);
      }),
    );
    for (const translated of results) {
      Object.assign(merged, translated);
    }
  }

  // If Gemini failed entirely, keep static regional overrides.
  const translatedCount = ALL_KEYS.filter((k) => merged[k] !== en[k]).length;
  if (translatedCount < Math.floor(ALL_KEYS.length * 0.4)) {
    const fallback = CATALOGS[lang] ?? en;
    return { catalog: fallback, source: "static-fallback" };
  }

  memoryCache.set(cacheKey(lang), merged);
  return { catalog: merged, source: "gemini" };
}
