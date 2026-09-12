import "server-only";

import {
  geminiGenerateContent,
  isGeminiKey,
  resolveAiApiKey,
} from "@/lib/ai/gemini";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * JSON chat completion via Gemini (native) or OpenAI, depending on the key.
 */
export async function completeJsonChat(input: {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<string | null> {
  const apiKey = resolveAiApiKey();
  if (!apiKey) return null;

  if (isGeminiKey(apiKey)) {
    return completeWithGemini(input);
  }
  return completeWithOpenAI(apiKey, input);
}

async function completeWithGemini(input: {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<string | null> {
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

  return geminiGenerateContent({
    system: systemBits.join("\n\n"),
    contents,
    json: true,
    temperature: input.temperature ?? 0.4,
  });
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
  return Boolean(resolveAiApiKey());
}
