import "server-only";

import { SignJWT, jwtVerify } from "jose";
import type { AppLanguage } from "@/lib/languages";
import { isAppLanguage } from "@/lib/languages";

export type EmailVerifyPayload = {
  email: string;
  lang: AppLanguage;
};

const TOKEN_TTL = "24h";

function secretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.DEVICE_ALERT_SECRET ||
    process.env.RESEND_API_KEY;
  if (!secret) {
    throw new Error("AUTH_SECRET must be configured for email login.");
  }
  return new TextEncoder().encode(secret);
}

export async function createEmailVerifyToken(
  email: string,
  lang: AppLanguage,
): Promise<string> {
  return new SignJWT({ email, lang, purpose: "email-verify" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());
}

export async function verifyEmailVerifyToken(
  token: string,
): Promise<EmailVerifyPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.purpose !== "email-verify") return null;
    const email = String(payload.email ?? "").trim().toLowerCase();
    const lang = payload.lang;
    if (!email || typeof lang !== "string" || !isAppLanguage(lang)) return null;
    return { email, lang };
  } catch {
    return null;
  }
}
