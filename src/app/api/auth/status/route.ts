import { NextResponse } from "next/server";
import { getMissingEmailEnv, isEmailEnvReady } from "@/lib/auth/email-env";
import { ensureSchema, getDb } from "@/lib/db/client";
import { getServerAppUrl } from "@/lib/server-app-url";

function cleanEnv(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

export async function GET() {
  const missing = getMissingEmailEnv();
  const relatedKeys = Object.keys(process.env)
    .filter((key) => /RESEND|AUTH|TURSO|DATABASE/i.test(key))
    .sort();

  const tursoUrl = cleanEnv(
    process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL,
  );
  const tursoToken = cleanEnv(process.env.TURSO_AUTH_TOKEN);
  const hasTursoUrl =
    tursoUrl.startsWith("libsql://") || tursoUrl.startsWith("https://");
  const hasTursoToken = tursoToken.length > 20;
  const tokenLooksJwt = tursoToken.split(".").length === 3;

  let dbReady = false;
  let dbError: string | null = null;
  try {
    if (!hasTursoUrl || !hasTursoToken) {
      throw new Error(
        !hasTursoUrl
          ? "TURSO_DATABASE_URL missing or invalid"
          : "TURSO_AUTH_TOKEN missing or invalid",
      );
    }
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
    tokenLooksJwt,
    tursoHost: hasTursoUrl
      ? tursoUrl
          .replace(/^libsql:\/\//, "")
          .replace(/^https:\/\//, "")
          .split("/")[0]
      : null,
    missing,
    appUrl: getServerAppUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ),
    configuredAppUrl: process.env.APP_URL?.trim() || null,
    relatedKeys,
    hint:
      missing.length > 0 || !dbReady
        ? "Update TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in Vercel Production, then Redeploy (env changes do not apply until redeploy)."
        : undefined,
  });
}
