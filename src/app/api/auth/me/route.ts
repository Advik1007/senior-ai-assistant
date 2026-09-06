import { NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/db/users";

/**
 * Session check.
 * - 401 = not authenticated
 * - 200 with user = authenticated (DB is source of truth for setup/lang when reachable)
 * - 503 = auth/DB temporarily unavailable (client must NOT treat as new user)
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.userId || !session.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const user = await findUserByEmail(session.email);
    if (!user || user.id !== session.userId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      lang: user.lang,
      setupCompleted: user.setup_completed,
    };

    // Keep cookie in sync with DB without forcing a logout.
    if (
      session.setupCompleted !== publicUser.setupCompleted ||
      session.lang !== publicUser.lang ||
      session.name !== publicUser.name
    ) {
      await setSessionCookie({
        userId: publicUser.id,
        email: publicUser.email,
        name: publicUser.name,
        lang: publicUser.lang,
        setupCompleted: publicUser.setupCompleted,
      });
    }

    return NextResponse.json({ ok: true, user: publicUser });
  } catch {
    // Temporary DB/network failure — use JWT claims, do not log the user out.
    return NextResponse.json(
      {
        ok: true,
        degraded: true,
        user: {
          id: session.userId,
          email: session.email,
          name: session.name,
          lang: session.lang,
          setupCompleted: session.setupCompleted,
        },
      },
      { status: 200 },
    );
  }
}
