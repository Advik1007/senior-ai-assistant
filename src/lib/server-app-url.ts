import { VERCEL_APP_URL } from "@/lib/vercel-app-url";

/** Public site URL for login links and emails. */
export function getServerAppUrl(): string {
  const raw =
    process.env.APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
      : "") ||
    VERCEL_APP_URL;

  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}
