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

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL)
  );
}

/**
 * Ops diagnostics. In production this requires `Authorization: Bearer <INBOX_SECRET>`.
 * Never returns secret values — only readiness flags.
 */
export async function GET(request: Request) {
  if (isProductionRuntime()) {
    const secret = process.env.INBOX_SECRET?.trim();
    const auth = request.headers.get("authorization")?.trim() || "";
    const ok = Boolean(secret) && auth === `Bearer ${secret}`;
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const missing = getMissingEmailEnv();

  const hasAiKey = Boolean(
    cleanEnv(process.env.GEMINI_API_KEY) || cleanEnv(process.env.AI_API_KEY),
  );
  const aiModel = cleanEnv(process.env.AI_MODEL) || null;

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
    hasAiKey,
    aiModel,
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
    hint:
      missing.length > 0 || !dbReady
        ? "Update TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in Vercel Production, then Redeploy (env changes do not apply until redeploy)."
        : !hasAiKey
          ? "Optional: add GEMINI_API_KEY (+ AI_MODEL=gemini-3.6-flash) for smarter Talk replies."
          : undefined,
  });
}
