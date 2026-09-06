import { NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie } from "@/lib/auth/session";
import { isAppLanguage } from "@/lib/languages";
import { setUserLanguage } from "@/lib/db/users";

/** Persist account language and refresh the session cookie. */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { lang?: string };
  if (!body.lang || !isAppLanguage(body.lang)) {
    return NextResponse.json({ ok: false, message: "invalid_lang" }, { status: 400 });
  }

  try {
    const user = await setUserLanguage(session.userId, body.lang);
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const token = await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      lang: user.lang,
      setupCompleted: user.setupCompleted,
    });

    return NextResponse.json({ ok: true, user, token });
  } catch {
    return NextResponse.json({ ok: false, message: "db_unavailable" }, { status: 503 });
  }
}
