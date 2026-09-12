import { NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie } from "@/lib/auth/session";
import { setUserSetupCompleted } from "@/lib/db/users";

/** Alias of complete-setup so markSetupComplete() can persist the account flag. */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const user = await setUserSetupCompleted(session.userId, true);
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const token = await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      lang: user.lang,
      setupCompleted: true,
    });

    return NextResponse.json({ ok: true, user, token });
  } catch {
    return NextResponse.json(
      { ok: false, message: "db_unavailable" },
      { status: 503 },
    );
  }
}
