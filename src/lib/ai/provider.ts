import "server-only";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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

/**
 * JSON chat completion via Gemini (native) or OpenAI, depending on the key.
 */
export async function completeJsonChat(input: {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<string | null> {
  const apiKey = resolveApiKey();
  if (!apiKey) return null;

  if (isGeminiKey(apiKey)) {
    return completeWithGemini(apiKey, input);
  }
  return completeWithOpenAI(apiKey, input);
}

async function completeWithGemini(
  apiKey: string,
  input: {
    system: string;
    messages: ChatMessage[];
    temperature?: number;
  },
): Promise<string | null> {
  const model = process.env.AI_MODEL?.trim() || "gemini-3.6-flash";
  const contents = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemBits = [
    input.system,
    ...input.messages.filter((m) => m.role === "system").map((m) => m.content),
  ].filter(Boolean);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemBits.join("\n\n") }],
        },
        contents,
        generationConfig: {
          temperature: input.temperature ?? 0.4,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

async function completeWithOpenAI(
  apiKey: string,
  input: {
    system: string;
    messages: ChatMessage[];
    temperature?: number;
  },
): Promise<string | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      temperature: input.temperature ?? 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        ...input.messages,
      ],
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? null;
}

export function hasAiApiKey(): boolean {
  return Boolean(resolveApiKey());
}
