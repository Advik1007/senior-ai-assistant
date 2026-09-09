import { NextResponse } from "next/server";
import { listSupportMessages } from "@/lib/db/support-messages";

function authorized(request: Request): boolean {
  const secret = process.env.INBOX_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-inbox-secret")?.trim();
  const url = new URL(request.url);
  const query = url.searchParams.get("secret")?.trim();
  return header === secret || query === secret;
}

/** List support/complaint messages for the inbox webpage. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await listSupportMessages(200);
    return NextResponse.json({ ok: true, messages });
  } catch {
    return NextResponse.json(
      { message: "Could not load messages." },
      { status: 500 },
    );
  }
}
