import "server-only";

import { aiPhrase } from "@/lib/ai/phrases";
import type { AppLanguage } from "@/lib/languages";
import { languageByCode } from "@/lib/languages";

export type TalkAction =
  | { type: "open_medical" }
  | { type: "open_doctor_nearby" }
  | { type: "open_shopping" }
  | { type: "open_routine" }
  | { type: "open_emergency" }
  | { type: "open_help" };

export type TalkInput = {
  message: string;
  lang: AppLanguage;
  userName: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  memory: string[];
};

export type TalkOutput = {
  reply: string;
  action?: TalkAction;
  memoryUpdates?: string[];
};

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function localTalk(input: TalkInput): TalkOutput {
  const text = input.message.toLowerCase().trim();
  const name = input.userName || aiPhrase(input.lang, "ai.friend");
  const say = (key: Parameters<typeof aiPhrase>[1], vars?: Record<string, string>) =>
    aiPhrase(input.lang, key, vars);

  if (includesAny(text, ["remember", "my name is", "i like", "i prefer"])) {
    return {
      reply: say("ai.remember", { name }),
      memoryUpdates: [input.message.trim()],
    };
  }

  if (
    includesAny(text, [
      "emergency",
      "ambulance",
      "police",
      "fire",
      "help me now",
      "आपात",
      "કટોકટી",
    ])
  ) {
    return { reply: say("ai.emergency"), action: { type: "open_emergency" } };
  }

  if (
    includesAny(text, [
      "grocery",
      "groceries",
      "shop",
      "shopping",
      "amazon",
      "blinkit",
      "order food",
      "खरीदारी",
      "ખરીદી",
    ])
  ) {
    return { reply: say("ai.shopping"), action: { type: "open_shopping" } };
  }

  if (
    includesAny(text, [
      "remind me",
      "reminder",
      "routine",
      "schedule",
      "tomorrow",
      "दिनचर्या",
      "દિનચર્યા",
    ])
  ) {
    return { reply: say("ai.openRoutine"), action: { type: "open_routine" } };
  }

  if (
    includesAny(text, [
      "doctor",
      "clinic",
      "symptom",
      "pain",
      "fever",
      "sick",
      "medicine",
      "medical",
      "डॉक्टर",
      "दवा",
      "ડૉક્ટર",
      "દવા",
    ])
  ) {
    if (includesAny(text, ["near", "nearby", "find", "recommend", "पास", "નજીક"])) {
      return {
        reply: say("ai.doctorsNearby"),
        action: { type: "open_doctor_nearby" },
      };
    }
    return { reply: say("ai.openMedical"), action: { type: "open_medical" } };
  }

  if (
    includesAny(text, ["help", "stuck", "trouble", "don't know how", "मदद", "મદદ"])
  ) {
    return { reply: say("ai.needHelp"), action: { type: "open_help" } };
  }

  if (
    includesAny(text, [
      "hello",
      "hi",
      "hey",
      "what's up",
      "namaste",
      "how are you",
      "bored",
      "नमस्ते",
      "નમસ્તે",
    ])
  ) {
    return { reply: say("ai.hello", { name }) };
  }

  if (includesAny(text, ["thank", "thanks", "धन्यवाद", "આભાર"])) {
    return { reply: say("ai.thanks", { name }) };
  }

  if (includesAny(text, ["bad day", "sad", "lonely", "worried"])) {
    return { reply: say("ai.sad", { name }) };
  }

  return { reply: say("ai.default", { name }) };
}

function buildSystemPrompt(lang: AppLanguage): string {
  const meta = languageByCode(lang);
  return `You are UNK — a warm, friendly voice companion for older adults. You are NOT a licensed doctor.

CRITICAL LANGUAGE RULE:
- The user's selected language is ${meta.englishName} (${meta.nativeLabel}).
- You MUST write the entire "reply" field ONLY in ${meta.englishName} using ${meta.nativeLabel} script/words.
- Do NOT reply in English unless the selected language is English.
- Keep replies short (2-4 sentences), simple, spoken aloud.

Speak naturally like a caring friend. Avoid robotic phrases.
Never prescribe medication or change doses.
For emergencies, immediately suggest the emergency screen.
For shopping, guide step-by-step but never place orders or enter payment.
Return JSON: { "reply": string, "action": null | "open_medical" | "open_doctor_nearby" | "open_shopping" | "open_routine" | "open_emergency" | "open_help", "memoryUpdates": string[] }
Only add memoryUpdates for safe preferences (foods, hobbies, style) — never medical diagnoses.`;
}

const ACTION_MAP: Record<string, TalkAction["type"]> = {
  open_medical: "open_medical",
  open_doctor_nearby: "open_doctor_nearby",
  open_shopping: "open_shopping",
  open_routine: "open_routine",
  open_emergency: "open_emergency",
  open_help: "open_help",
};

export async function generateTalkReply(input: TalkInput): Promise<TalkOutput> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return localTalk(input);

  try {
    const meta = languageByCode(input.lang);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(input.lang) },
          {
            role: "system",
            content: `Reply language MUST be ${meta.englishName} (${meta.htmlLang}, ${meta.nativeLabel}). User name: ${input.userName}. Memory: ${input.memory.join("; ") || "none"}`,
          },
          ...input.history.slice(-8),
          { role: "user", content: input.message },
        ],
      }),
    });

    if (!res.ok) return localTalk(input);

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return localTalk(input);

    const parsed = JSON.parse(raw) as {
      reply?: string;
      action?: string | null;
      memoryUpdates?: string[];
    };

    const actionType = parsed.action ? ACTION_MAP[parsed.action] : undefined;

    return {
      reply: parsed.reply || localTalk(input).reply,
      action: actionType ? { type: actionType } : undefined,
      memoryUpdates: parsed.memoryUpdates,
    };
  } catch {
    return localTalk(input);
  }
}
