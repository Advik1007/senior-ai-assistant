import "server-only";

import { aiPhrase } from "@/lib/ai/phrases";
import { completeJsonChat, hasAiApiKey } from "@/lib/ai/provider";
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
      "bored",
      "boring",
      "nothing to do",
      "free time",
      "बोर",
      "बोरियत",
      "कुछ नहीं करना",
    ])
  ) {
    return { reply: say("ai.bored", { name }) };
  }

  if (
    includesAny(text, [
      "hello",
      "hi",
      "hey",
      "what's up",
      "namaste",
      "how are you",
      "नमस्ते",
      "નમસ્તે",
    ])
  ) {
    return { reply: say("ai.hello", { name }) };
  }

  if (includesAny(text, ["thank", "thanks", "धन्यवाद", "આભાર"])) {
    return { reply: say("ai.thanks", { name }) };
  }

  if (
    includesAny(text, [
      "bad day",
      "sad",
      "lonely",
      "worried",
      "अकेला",
      "उदास",
    ])
  ) {
    return { reply: say("ai.sad", { name }) };
  }

  return { reply: say("ai.default", { name }) };
}

function buildSystemPrompt(lang: AppLanguage): string {
  const meta = languageByCode(lang);
  return `You are UNK — a helpful, friendly conversational AI assistant (like ChatGPT), designed to be easy for older adults to talk to.

You can discuss ALMOST ANYTHING the user wants:
- Random chat, jokes, stories, opinions, hobbies, news topics, cooking, travel, movies, cricket, religion, family life, technology explained simply, homework for grandkids, "what should I do today", boredom, loneliness, motivation
- General knowledge questions, how-to explanations, ideas, brainstorming
- Empathy and listening when they share feelings

CRITICAL LANGUAGE RULE:
- The user's selected language is ${meta.englishName} (${meta.nativeLabel}).
- Write the entire "reply" ONLY in ${meta.englishName} (${meta.nativeLabel}).
- Do NOT reply in English unless the selected language is English.
- Keep language clear and spoken-friendly (avoid jargon). Replies can be a short paragraph or a few bullets when helpful — usually 2-8 sentences.

STYLE:
- Talk like a real companion, not an app menu.
- Follow the user's topic. Do not force medical/shopping/routine unless they ask or it clearly helps.
- Ask a natural follow-up question when the chat should continue.
- Be warm, curious, and practical.

SAFETY:
- You are NOT a licensed doctor. For serious symptoms, urge seeing a clinician / emergency services (112/108/911) and you may set action "open_emergency" or "open_doctor_nearby" / "open_medical".
- Never prescribe or change medicines.
- Never place orders or handle payments; for shopping you may set action "open_shopping" and guide them.
- Do not help with crime, weapons, or self-harm methods. For crisis feelings, be supportive and suggest contacting emergency/family help.

OPTIONAL APP ACTIONS (only when clearly useful):
"open_medical" | "open_doctor_nearby" | "open_shopping" | "open_routine" | "open_emergency" | "open_help"
Otherwise set "action": null.

Return ONLY JSON:
{ "reply": string, "action": null | "open_medical" | "open_doctor_nearby" | "open_shopping" | "open_routine" | "open_emergency" | "open_help", "memoryUpdates": string[] }
memoryUpdates: only safe personal preferences (foods, hobbies, likes) — never medical diagnoses.`;
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
  if (!hasAiApiKey()) return localTalk(input);

  try {
    const meta = languageByCode(input.lang);
    const raw = await completeJsonChat({
      system: buildSystemPrompt(input.lang),
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: `Reply language MUST be ${meta.englishName} (${meta.htmlLang}, ${meta.nativeLabel}). User name: ${input.userName}. Known preferences: ${input.memory.join("; ") || "none"}. Chat freely about whatever they bring up.`,
        },
        ...input.history.slice(-16),
        { role: "user", content: input.message },
      ],
    });

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
