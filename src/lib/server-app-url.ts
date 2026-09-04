const FALLBACK_APP_URL =
  "https://senior-ai-assistant-git-main-advik1007.vercel.app";

const BROKEN_HOSTS = new Set([
  "app.unk.com",
  "www.app.unk.com",
  "unk.com",
  "www.unk.com",
  "app.unkai.com",
  "www.app.unkai.com",
]);

function normalizeUrl(raw: string): string {
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

function isUsableAppUrl(raw: string): boolean {
  try {
    const host = new URL(normalizeUrl(raw)).host.toLowerCase();
    if (BROKEN_HOSTS.has(host)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Public site URL for login links and emails.
 * Prefer the live request host so links never point at a dead custom domain.
 */
export function getServerAppUrl(requestOrigin?: string | null): string {
  if (requestOrigin && isUsableAppUrl(requestOrigin)) {
    return normalizeUrl(requestOrigin);
  }

  const configured = process.env.APP_URL?.trim();
  if (configured && isUsableAppUrl(configured)) {
    return normalizeUrl(configured);
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return normalizeUrl(vercelHost);
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production && isUsableAppUrl(production)) {
    return normalizeUrl(production);
  }

  return FALLBACK_APP_URL;
}
