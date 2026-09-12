import "server-only";

function resolveApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.AI_API_KEY?.trim() ||
    null
  );
}

function isGeminiKey(key: string): boolean {
  return (
    key.startsWith("AQ.") ||
    key.startsWith("AIza") ||
    Boolean(process.env.GEMINI_API_KEY?.trim())
  );
}

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
  const apiKey = resolveApiKey();
  if (!apiKey) return null;

  if (isGeminiKey(apiKey)) {
    return transcribeWithGemini(apiKey, input);
  }
  return transcribeWithOpenAI(apiKey, input);
}

async function transcribeWithGemini(
  apiKey: string,
  input: { bytes: Buffer; mimeType: string; lang: string },
): Promise<string | null> {
  const model = process.env.AI_MODEL?.trim() || "gemini-2.0-flash";
  const mime = input.mimeType.split(";")[0] || "audio/webm";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `Transcribe spoken audio. Language hint: ${languageHint(input.lang)}. Reply with JSON only: {"transcript":"..."} . If there is no speech, use an empty transcript.`,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: mime, data: input.bytes.toString("base64") } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
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
  return Boolean(resolveApiKey());
}
