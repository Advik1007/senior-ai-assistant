import { NextResponse } from "next/server";

/**
 * Future home for the server-side AI assistant.
 * API keys must stay here — never in the browser.
 * This first version uses on-device intent matching instead.
 */
export async function POST() {
  const key = process.env.AI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        status: "api_connection_required",
        message:
          "No AI API key is configured. UNK is using on-device understanding only.",
      },
      { status: 501 },
    );
  }

  return NextResponse.json(
    {
      status: "api_connection_required",
      message: "AI provider wiring is not implemented yet.",
    },
    { status: 501 },
  );
}
