import "server-only";

import {
  geminiGenerateContent,
  isGeminiKey,
  resolveAiApiKey,
} from "@/lib/ai/gemini";

function languageHint(lang: string): string {
  const trimmed = lang.trim();
  if (!trimmed) return "en";
  return trimmed;
}

/**
 * Turn a spoken audio clip into text using the same AI key as Talk.
 */
export async function transcribeAudio(input: {
  bytes: Buffer;
  mimeType: string;
  lang: string;
}): Promise<string | null> {
  const apiKey = resolveAiApiKey();
  if (!apiKey) return null;

  if (isGeminiKey(apiKey)) {
    return transcribeWithGemini(input);
  }
  return transcribeWithOpenAI(apiKey, input);
}

async function transcribeWithGemini(input: {
  bytes: Buffer;
  mimeType: string;
  lang: string;
}): Promise<string | null> {
  const mime = input.mimeType.split(";")[0] || "audio/mp4";
  const raw = await geminiGenerateContent({
    system: `Transcribe spoken audio. Language hint: ${languageHint(input.lang)}. Reply with JSON only: {"transcript":"..."} . If there is no speech, use an empty transcript.`,
    json: true,
    temperature: 0,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mime,
              data: input.bytes.toString("base64"),
            },
          },
        ],
      },
    ],
  });
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { transcript?: unknown };
    return typeof parsed.transcript === "string" ? parsed.transcript.trim() : null;
  } catch {
    return raw.replace(/^["']|["']$/g, "").trim() || null;
  }
}

async function transcribeWithOpenAI(
  apiKey: string,
  input: { bytes: Buffer; mimeType: string; lang: string },
): Promise<string | null> {
  const mime = input.mimeType.split(";")[0] || "audio/webm";
  const ext = mime.includes("mp4") || mime.includes("aac") ? "m4a" : "webm";
  const form = new FormData();
  form.append("file", new File([new Uint8Array(input.bytes)], `speech.${ext}`, { type: mime }));
  form.append("model", "whisper-1");
  form.append("language", languageHint(input.lang).slice(0, 2));

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { text?: string };
  return data.text?.trim() || null;
}

export function canTranscribeAudio(): boolean {
  return Boolean(resolveAiApiKey());
}
