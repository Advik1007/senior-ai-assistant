import { NextResponse } from "next/server";
import { createEmailVerifyToken } from "@/lib/auth/email-verify";
import {
  EmailConfigurationError,
  EmailDeliveryError,
  sendEmailVerification,
} from "@/lib/email/service";
import { isAppLanguage } from "@/lib/languages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; lang?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const lang = body.lang && isAppLanguage(body.lang) ? body.lang : "en";

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { message: "invalid_email" },
        { status: 400 },
      );
    }

    const appUrl = process.env.APP_URL || "http://127.0.0.1:43141";
    const token = await createEmailVerifyToken(email, lang);
    const verifyUrl = `${appUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(token)}`;

    await sendEmailVerification({
      to: email,
      name: email.split("@")[0] || "UNK AI user",
      verificationUrl: verifyUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EmailConfigurationError) {
      return NextResponse.json({ message: "not_configured" }, { status: 503 });
    }
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json({ message: "send_failed" }, { status: 502 });
    }
    if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
      return NextResponse.json({ message: "not_configured" }, { status: 503 });
    }
    return NextResponse.json({ message: "send_failed" }, { status: 500 });
  }
}
