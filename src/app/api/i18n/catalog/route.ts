import { NextResponse } from "next/server";
import { CATALOGS } from "@/lib/i18n/catalogs";
import { I18N_CATALOG_VERSION } from "@/lib/i18n/catalog-version";
import { isAppLanguage } from "@/lib/languages";

/**
 * Static bundled UI catalog only.
 * No Gemini / Google Translate / LibreTranslate — translations ship in the app.
 */
export async function GET(request: Request) {
  const langParam = new URL(request.url).searchParams.get("lang")?.trim() || "en";
  if (!isAppLanguage(langParam)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  return NextResponse.json(
    {
      version: I18N_CATALOG_VERSION,
      lang: langParam,
      source: "static",
      catalog: CATALOGS[langParam],
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
