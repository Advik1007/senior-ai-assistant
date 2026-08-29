import { NextResponse } from "next/server";
import {
  EmailConfigurationError,
  EmailDeliveryError,
  sendContactEmail,
} from "@/lib/email/service";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 3;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientId(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(id: string): boolean {
  const now = Date.now();
  const current = attempts.get(id);
  if (!current || current.resetAt <= now) {
    attempts.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

export async function POST(request: Request) {
  if (isRateLimited(clientId(request))) {
    return NextResponse.json(
      { message: "Too many messages. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      message?: unknown;
      website?: unknown;
    };

    // Quietly accept bot submissions to avoid teaching bots around the trap.
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ ok: true });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { message: "Please enter your name." },
        { status: 400 },
      );
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 },
      );
    }
    if (message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { message: "Your message must be between 10 and 5,000 characters." },
        { status: 400 },
      );
    }

    await sendContactEmail({ name, email, message });
    return NextResponse.json({ ok: true });
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
      { message: "The message could not be sent." },
      { status: 500 },
    );
  }
}

