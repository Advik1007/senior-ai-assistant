import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { createHash, randomUUID } from "node:crypto";
import type { AppLanguage } from "@/lib/languages";
import { isAppLanguage } from "@/lib/languages";

export type DeviceLoginDetails = {
  deviceName: string;
  browser: string;
  location: string;
  time: string;
};

export type DeviceLoginTokenPayload = DeviceLoginDetails & {
  alertId: string;
  userName: string;
  userEmail: string;
  lang: AppLanguage;
  action: "approve" | "deny";
};

const TOKEN_TTL = "48h";
const usedTokenHashes = new Set<string>();

function secretKey(): Uint8Array {
  const secret =
    process.env.DEVICE_ALERT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.RESEND_API_KEY;
  if (!secret) {
    throw new Error("DEVICE_ALERT_SECRET or AUTH_SECRET must be configured.");
  }
  return new TextEncoder().encode(secret);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createDeviceLoginToken(
  input: Omit<DeviceLoginTokenPayload, "alertId" | "action"> & {
    action: "approve" | "deny";
    alertId?: string;
  },
): Promise<string> {
  const alertId = input.alertId ?? randomUUID();
  return new SignJWT({
    alertId,
    userName: input.userName,
    userEmail: input.userEmail,
    lang: input.lang,
    deviceName: input.deviceName,
    browser: input.browser,
    location: input.location,
    time: input.time,
    action: input.action,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());
}

export async function verifyDeviceLoginToken(
  token: string,
): Promise<
  | { ok: true; payload: DeviceLoginTokenPayload }
  | { ok: false; reason: "invalid" | "used" }
> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const action = payload.action;
    if (action !== "approve" && action !== "deny") {
      return { ok: false, reason: "invalid" };
    }
    const lang = payload.lang;
    if (typeof lang !== "string" || !isAppLanguage(lang)) {
      return { ok: false, reason: "invalid" };
    }

    const digest = hashToken(token);
    if (usedTokenHashes.has(digest)) {
      return { ok: false, reason: "used" };
    }
    usedTokenHashes.add(digest);

    return {
      ok: true,
      payload: {
        alertId: String(payload.alertId ?? ""),
        userName: String(payload.userName ?? ""),
        userEmail: String(payload.userEmail ?? ""),
        lang,
        deviceName: String(payload.deviceName ?? ""),
        browser: String(payload.browser ?? ""),
        location: String(payload.location ?? ""),
        time: String(payload.time ?? ""),
        action,
      },
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export async function createDeviceLoginLinks(input: {
  userName: string;
  userEmail: string;
  lang: AppLanguage;
  details: DeviceLoginDetails;
  appUrl: string;
  alertId?: string;
}): Promise<{ approveUrl: string; denyUrl: string; alertId: string }> {
  const alertId = input.alertId ?? randomUUID();
  const base = {
    alertId,
    userName: input.userName,
    userEmail: input.userEmail,
    lang: input.lang,
    ...input.details,
  };

  const [approveToken, denyToken] = await Promise.all([
    createDeviceLoginToken({ ...base, action: "approve" }),
    createDeviceLoginToken({ ...base, action: "deny" }),
  ]);

  const root = input.appUrl.replace(/\/$/, "");
  return {
    alertId,
    approveUrl: `${root}/auth/device/approve?token=${encodeURIComponent(approveToken)}`,
    denyUrl: `${root}/auth/device/deny?token=${encodeURIComponent(denyToken)}`,
  };
}
