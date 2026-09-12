import { NextResponse } from "next/server";
import { canTranscribeAudio, transcribeAudio } from "@/lib/ai/transcribe";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  if (!canTranscribeAudio()) {
    return NextResponse.json({ message: "unavailable" }, { status: 503 });
  }

  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const lang = String(form.get("lang") || "en");

    if (!(audio instanceof Blob) || audio.size < 200) {
      return NextResponse.json({ message: "empty" }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return NextResponse.json({ message: "too_large" }, { status: 413 });
    }

    const bytes = Buffer.from(await audio.arrayBuffer());
    const transcript = await transcribeAudio({
      bytes,
      mimeType: audio.type || "audio/webm",
      lang,
    });

    if (transcript == null) {
      return NextResponse.json({ message: "failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, transcript });
  } catch {
    return NextResponse.json({ message: "failed" }, { status: 500 });
  }
}
