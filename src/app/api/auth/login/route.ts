import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { findUserByEmail, toPublicUser } from "@/lib/db/users";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!EMAIL_PATTERN.test(email) || !password) {
      return NextResponse.json(
        { message: "invalid_credentials" },
        { status: 401 },
      );
    }

    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json(
        { message: "invalid_credentials" },
        { status: 401 },
      );
    }

    const publicUser = toPublicUser(user);
    await setSessionCookie({
      userId: publicUser.id,
      email: publicUser.email,
      name: publicUser.name,
      lang: publicUser.lang,
    });

    return NextResponse.json({ ok: true, user: publicUser });
  } catch (error) {
    const text = error instanceof Error ? error.message : "";
    if (/ENOENT|readonly|EACCES|SQLITE|database/i.test(text)) {
      return NextResponse.json({ message: "db_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ message: "login_failed" }, { status: 500 });
  }
}
