import { NextResponse } from "next/server";
import { isAppLanguage, type AppLanguage } from "@/lib/languages";
import {
  EmailConfigurationError,
  EmailDeliveryError,
  sendEmailVerification,
  sendNewDeviceLoginAlert,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "@/lib/email/service";

type TestKind =
  | "welcome"
  | "verification"
  | "password-reset"
  | "device-login";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const recipient = process.env.EMAIL_TEST_RECIPIENT;
  const appUrl = process.env.APP_URL || "http://127.0.0.1:43141";
  if (!recipient) {
    return NextResponse.json(
      { message: "EMAIL_TEST_RECIPIENT is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      kind?: TestKind;
      lang?: string;
    };
    const kind = body.kind || "welcome";
    const lang: AppLanguage =
      body.lang && isAppLanguage(body.lang) ? body.lang : "en";

    if (kind === "welcome") {
      await sendWelcomeEmail({ to: recipient, name: "UNK AI Tester" });
    } else if (kind === "verification") {
      await sendEmailVerification({
        to: recipient,
        name: "UNK AI Tester",
        verificationUrl: `${appUrl}/verify-email?token=development-test-token`,
      });
    } else if (kind === "password-reset") {
      await sendPasswordResetEmail({
        to: recipient,
        name: "UNK AI Tester",
        resetUrl: `${appUrl}/reset-password?token=development-test-token`,
      });
    } else if (kind === "device-login") {
      await sendNewDeviceLoginAlert({
        to: recipient,
        userName: "UNK AI Tester",
        lang,
        deviceName: "MacBook Air",
        browser: "Chrome",
        location: "Mumbai, India",
        time: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
    } else {
      return NextResponse.json(
        { message: "Unknown email template." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, kind });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 400 },
      );
    }
    if (error instanceof EmailConfigurationError) {
      return NextResponse.json(
        { message: "Email is not configured yet." },
        { status: 503 },
      );
    }
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json({ message: error.message }, { status: 502 });
    }
    return NextResponse.json(
      { message: "The test email could not be sent." },
      { status: 500 },
    );
  }
}

