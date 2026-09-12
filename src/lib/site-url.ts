/** Stable production URL for links, email, and redirects. */
export const DEFAULT_PRODUCTION_URL = "https://senior-ai-assistant.vercel.app";

export function getCanonicalAppUrl(): string {
  const raw =
    process.env.APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    DEFAULT_PRODUCTION_URL;

  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

export function getCanonicalHost(): string {
  return new URL(getCanonicalAppUrl()).host;
}

/** True for per-deployment preview hosts (not the stable production alias). */
export function isEphemeralVercelHost(host: string): boolean {
  const normalized = host.toLowerCase();
  if (!normalized.endsWith(".vercel.app")) return false;
  return normalized !== getCanonicalHost().toLowerCase();
}
