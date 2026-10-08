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

function deepgramKey(): string | null {
  return process.env.DEEPGRAM_API_KEY?.trim() || null;
}

/** nova-3 accepts en-IN for English and the base code for Indian languages. */
function deepgramLanguage(lang: string): string {
  const code = languageHint(lang).toLowerCase();
  if (code.startsWith("en")) return "en-IN";
  return code.slice(0, 2);
}

/**
 * Turn a spoken audio clip into text. Deepgram when configured, otherwise the Talk key.
 */
export async function transcribeAudio(input: {
  bytes: Buffer;
  mimeType: string;
  lang: string;
}): Promise<string | null> {
  const dgKey = deepgramKey();
  if (dgKey) return transcribeWithDeepgram(dgKey, input);

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

async function transcribeWithDeepgram(
  apiKey: string,
  input: { bytes: Buffer; mimeType: string; lang: string },
): Promise<string | null> {
  const params = new URLSearchParams({
    model: process.env.DEEPGRAM_MODEL?.trim() || "nova-3",
    language: deepgramLanguage(input.lang),
    smart_format: "true",
    punctuate: "true",
  });
  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": input.mimeType.split(";")[0] || "audio/webm",
    },
    body: new Uint8Array(input.bytes),
  });
  if (!res.ok) {
    console.error("[deepgram]", res.status);
    return null;
  }
  const data = (await res.json()) as {
    results?: {
      channels?: Array<{ alternatives?: Array<{ transcript?: string }> }>;
    };
  };
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
}

export function canTranscribeAudio(): boolean {
  return Boolean(deepgramKey() || resolveAiApiKey());
}
