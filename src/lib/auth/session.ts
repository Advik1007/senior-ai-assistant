import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AppLanguage } from "@/lib/languages";
import { isAppLanguage } from "@/lib/languages";

export const SESSION_COOKIE = "unk_session";
const SESSION_TTL = "30d";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  lang: AppLanguage;
};

function secretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.DEVICE_ALERT_SECRET ||
    "unk-ai-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    lang: payload.lang,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const lang = payload.lang;
    if (typeof lang !== "string" || !isAppLanguage(lang)) return null;
    return {
      userId: String(payload.userId ?? ""),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      lang,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
