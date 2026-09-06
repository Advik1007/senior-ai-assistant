import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

/**
 * Fast session check from JWT (cookie or Bearer).
 * Avoids a Turso round-trip on every app open so the gate does not lag
 * and bounce people back to Sign in.
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId || !session.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      lang: session.lang,
    },
  });
}
