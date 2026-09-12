import "server-only";

export function resolveAiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.AI_API_KEY?.trim() ||
    null
  );
}

export function isGeminiKey(key: string): boolean {
  return (
    key.startsWith("AQ.") ||
    key.startsWith("AIza") ||
    Boolean(process.env.GEMINI_API_KEY?.trim())
  );
}

export function geminiModel(): string {
  return process.env.AI_MODEL?.trim() || "gemini-3.6-flash";
}

export function extractGeminiText(data: unknown): string | null {
  const parts =
    (
      data as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string; thought?: boolean }> };
        }>;
      }
    ).candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join("")
    .trim();
  return text || null;
}

export async function geminiGenerateContent(input: {
  system?: string;
  contents: Array<{
    role: string;
    parts: Array<Record<string, unknown>>;
  }>;
  json?: boolean;
  temperature?: number;
}): Promise<string | null> {
  const apiKey = resolveAiApiKey();
  if (!apiKey || !isGeminiKey(apiKey)) return null;

  const model = geminiModel();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: input.system
          ? { parts: [{ text: input.system }] }
          : undefined,
        contents: input.contents,
        generationConfig: {
          temperature: input.temperature ?? 0.4,
          responseMimeType: input.json ? "application/json" : undefined,
          thinkingConfig: { thinkingLevel: "MINIMAL" },
        },
      }),
    },
  );

  if (!res.ok) {
    console.error("[gemini]", res.status);
    return null;
  }

  return extractGeminiText(await res.json());
}
