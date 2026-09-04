import { NextResponse } from "next/server";
import { getMissingEmailEnv, isEmailEnvReady } from "@/lib/auth/email-env";
import { ensureSchema, getDb } from "@/lib/db/client";
import { getServerAppUrl } from "@/lib/server-app-url";

export async function GET() {
  const missing = getMissingEmailEnv();
  const relatedKeys = Object.keys(process.env)
    .filter((key) => /RESEND|AUTH|TURSO|DATABASE/i.test(key))
    .sort();

  const hasTursoUrl = Boolean(
    process.env.TURSO_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim(),
  );
  const hasTursoToken = Boolean(process.env.TURSO_AUTH_TOKEN?.trim());

  let dbReady = false;
  let dbError: string | null = null;
  try {
    await ensureSchema();
    await getDb().execute("SELECT 1 AS ok");
    dbReady = true;
  } catch (error) {
    const raw = error instanceof Error ? error.message : "db_error";
    dbError = raw.replace(/[^\x20-\x7E]/g, "?").slice(0, 160);
  }

  return NextResponse.json({
    emailReady: isEmailEnvReady(),
    dbReady,
    dbError,
    hasTursoUrl,
    hasTursoToken,
    missing,
    appUrl: getServerAppUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ),
    configuredAppUrl: process.env.APP_URL?.trim() || null,
    relatedKeys,
    hint:
      missing.length > 0 || !dbReady
        ? "For signup: set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (Production), then Redeploy. Token must be a database token from Turso."
        : undefined,
  });
}
