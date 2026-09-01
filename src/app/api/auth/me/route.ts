import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findUserByEmail, toPublicUser } from "@/lib/db/users";

export async function GET() {
  const session = await getSession();
  if (!session?.userId || !session.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const user = await findUserByEmail(session.email);
  if (!user || user.id !== session.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: toPublicUser(user),
  });
}
