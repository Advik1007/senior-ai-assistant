import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { createUser, findUserByEmail } from "@/lib/db/users";
import { sendWelcomeEmail } from "@/lib/email/service";
import { isAppLanguage } from "@/lib/languages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      lang?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";
    const lang = body.lang && isAppLanguage(body.lang) ? body.lang : "en";

    if (!name || name.length < 2) {
      return NextResponse.json({ message: "name_required" }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ message: "invalid_email" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "password_short" }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ message: "password_mismatch" }, { status: 400 });
    }

    let existing;
    try {
      existing = await findUserByEmail(email);
    } catch {
      return NextResponse.json({ message: "db_unavailable" }, { status: 503 });
    }
    if (existing) {
      return NextResponse.json({ message: "email_in_use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = await createUser({
        email,
        name,
        passwordHash,
        lang,
      });
    } catch {
      return NextResponse.json({ message: "db_unavailable" }, { status: 503 });
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      lang: user.lang,
    });

    try {
      await sendWelcomeEmail({ to: user.email, name: user.name });
    } catch {
      // Account is created even if welcome email is not configured.
    }

    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ message: "signup_failed" }, { status: 500 });
  }
}
