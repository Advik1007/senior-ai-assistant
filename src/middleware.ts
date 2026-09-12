import { NextResponse, type NextRequest } from "next/server";
import {
  getCanonicalAppUrl,
  getCanonicalHost,
  isEphemeralVercelHost,
} from "@/lib/site-url";

/**
 * Send users on short-lived preview deployment URLs to the stable production
 * domain so old bookmarks do not hit DEPLOYMENT_NOT_FOUND on Vercel.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (
    !host ||
    host.includes("localhost") ||
    host.startsWith("127.0.0.1") ||
    host === getCanonicalHost()
  ) {
    return NextResponse.next();
  }

  if (!isEphemeralVercelHost(host)) {
    return NextResponse.next();
  }

  const canonical = new URL(getCanonicalAppUrl());
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical);
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
