import { NextResponse } from "next/server";
import { verifyEmailVerifyToken } from "@/lib/auth/email-verify";
import { setSessionCookie } from "@/lib/auth/session";
import { findOrCreateUserByEmail } from "@/lib/db/users";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, reason: "missing" }, { status: 400 });
  }

  const payload = await verifyEmailVerifyToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const user = await findOrCreateUserByEmail({
    email: payload.email,
    lang: payload.lang,
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    lang: user.lang,
  });

  return NextResponse.json({
    ok: true,
    email: user.email,
    lang: user.lang,
    user,
  });
}
