import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AppLanguage } from "@/lib/languages";
import { isAppLanguage } from "@/lib/languages";

export const SESSION_COOKIE = "unk_session";
const SESSION_TTL = "30d";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  lang: AppLanguage;
  setupCompleted: boolean;
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
    setupCompleted: payload.setupCompleted ? 1 : 0,
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
    const userId = String(payload.userId ?? "");
    const email = String(payload.email ?? "");
    if (!userId || !email) return null;
    return {
      userId,
      email,
      name: String(payload.name ?? ""),
      lang,
      setupCompleted:
        payload.setupCompleted === true ||
        payload.setupCompleted === 1 ||
        payload.setupCompleted === "1",
    };
  } catch {
    return null;
  }
}

function cookieSecure(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.APP_URL?.startsWith("https://"))
  );
}

export async function setSessionCookie(
  payload: SessionPayload,
): Promise<string> {
  const token = await createSessionToken(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return token;
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

/** Cookie first, then Authorization: Bearer (Android WebView fallback). */
export async function getSessionFromRequest(
  request?: Request,
): Promise<SessionPayload | null> {
  const fromCookie = await getSession();
  if (fromCookie) return fromCookie;

  const header = request?.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) return null;
  return verifySessionToken(match[1].trim());
}
