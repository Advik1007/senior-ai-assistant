import { NextResponse } from "next/server";
import { getMissingEmailEnv, isEmailEnvReady } from "@/lib/auth/email-env";
import { VERCEL_APP_URL } from "@/lib/vercel-app-url";

export async function GET() {
  return NextResponse.json({
    emailReady: isEmailEnvReady(),
    missing: getMissingEmailEnv(),
    appUrl: process.env.APP_URL?.trim() || VERCEL_APP_URL,
  });
}
