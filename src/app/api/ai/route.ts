import { NextResponse } from "next/server";

/**
 * Talk keys stay on the server — never in the browser.
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
