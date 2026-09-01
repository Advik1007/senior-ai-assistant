import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { markUserOnboardingComplete } from "@/lib/db/users";

export async function POST() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await markUserOnboardingComplete(session.userId);
  return NextResponse.json({ ok: true });
}
