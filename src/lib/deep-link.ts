/** Deep link helpers so email “Yes, it was me” opens the UNK AI Android app. */

export const APP_ID = "ai.unk.app";
export const APP_SCHEME = "ai.unk.app";

/** Custom-scheme URL the Android app registers (ai.unk.app://…). */
export function toAppDeepLink(pathAndQuery: string): string {
  const cleaned = pathAndQuery.startsWith("/")
    ? pathAndQuery
    : `/${pathAndQuery}`;
  return `${APP_SCHEME}://${cleaned.replace(/^\//, "")}`;
}

/**
 * Android Intent URL: opens the installed app, falls back to the https page.
 * Works from Chrome / Gmail when the custom scheme alone is blocked.
 */
export function toAndroidIntentUrl(
  httpsUrl: string,
  pathAndQuery: string,
): string {
  const path = pathAndQuery.startsWith("/")
    ? pathAndQuery.slice(1)
    : pathAndQuery;
  const fallback = encodeURIComponent(httpsUrl);
  return `intent://${path}#Intent;scheme=${APP_SCHEME};package=${APP_ID};S.browser_fallback_url=${fallback};end`;
}

/** Turn a custom-scheme or https deep link into an in-app path (/auth/verify?…). */
export function pathFromDeepLinkUrl(url: string): string | null {
  try {
    if (url.startsWith(`${APP_SCHEME}://`)) {
      const rest = url.slice(`${APP_SCHEME}://`.length);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
    const u = new URL(url);
    if (
      u.pathname.startsWith("/auth/verify") ||
      u.pathname.startsWith("/auth/device/") ||
      u.pathname.startsWith("/home") ||
      u.pathname.startsWith("/setup/")
    ) {
      return `${u.pathname}${u.search}`;
    }
    return null;
  } catch {
    return null;
  }
}
