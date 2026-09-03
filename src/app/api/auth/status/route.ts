import { NextResponse } from "next/server";
import { getMissingEmailEnv, isEmailEnvReady } from "@/lib/auth/email-env";
import { getServerAppUrl } from "@/lib/server-app-url";

export async function GET() {
  const missing = getMissingEmailEnv();
  const relatedKeys = Object.keys(process.env).filter((key) =>
    /RESEND|AUTH/i.test(key),
  );

  return NextResponse.json({
    emailReady: isEmailEnvReady(),
    missing,
    appUrl: getServerAppUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ),
    configuredAppUrl: process.env.APP_URL?.trim() || null,
    relatedKeys,
    hint:
      missing.length > 0
        ? "Add missing keys in Vercel → Settings → Environment Variables → Production, then Redeploy."
        : undefined,
  });
}
