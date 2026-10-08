import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Deepgram Aura rejects requests over 2000 characters. */
const MAX_CHARS = 2000;

export async function POST(request: Request) {
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ message: "unavailable" }, { status: 503 });
  }

  let text = "";
  try {
    const body = (await request.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    return NextResponse.json({ message: "bad_request" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ message: "empty" }, { status: 400 });
  }

  const params = new URLSearchParams({
    model: process.env.DEEPGRAM_TTS_MODEL?.trim() || "aura-2-harmonia-en",
    encoding: "mp3",
  });
  const res = await fetch(`https://api.deepgram.com/v1/speak?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: text.slice(0, MAX_CHARS) }),
  });

  if (!res.ok || !res.body) {
    console.error("[deepgram-tts]", res.status);
    return NextResponse.json({ message: "failed" }, { status: 502 });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
