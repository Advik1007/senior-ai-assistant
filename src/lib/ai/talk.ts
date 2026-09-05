import "server-only";

import { aiPhrase } from "@/lib/ai/phrases";
import { completeJsonChat, hasAiApiKey } from "@/lib/ai/provider";
import type { AppLanguage } from "@/lib/languages";
import { languageByCode } from "@/lib/languages";
import {
  formatReminderWhen,
  parseReminderSpeech,
} from "@/lib/routine/parse-reminder";
import { toDateKey } from "@/lib/storage/routines";

export type TalkAction =
  | { type: "open_medical" }
  | { type: "open_doctor_nearby" }
  | { type: "open_shopping" }
  | { type: "open_routine"; date?: string }
  | { type: "open_emergency" }
  | { type: "open_help" }
  | {
      type: "create_reminder";
      title: string;
      date?: string;
      time?: string;
      days?: string;
      kind?: "reminder" | "medicine" | "appointment" | "task";
    };

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
      "remind me",
      "reminder",
      "याद दिला",
      "યાદ અપાવ",
    ])
  ) {
    const parsed = parseReminderSpeech(
      input.message,
      say("ai.reminderLabel"),
    );
    if (parsed) {
      return {
        reply: say("ai.reminderSaved", {
          when: formatReminderWhen(parsed),
        }),
        action: {
          type: "create_reminder",
          title: parsed.title,
          date: parsed.date,
          time: parsed.time || undefined,
          days: parsed.days,
          kind: parsed.kind,
        },
      };
    }
    return { reply: say("ai.openRoutine"), action: { type: "open_routine" } };
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
      "routine",
      "schedule",
      "calendar",
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
- "open_medical" | "open_doctor_nearby" | "open_shopping" | "open_routine" | "open_emergency" | "open_help"
- For reminders like "remind me on the 25th to go to the doctor", set action to an object:
  { "type": "create_reminder", "title": string, "date": "YYYY-MM-DD" (optional), "time": "HH:mm" (optional), "days": "once"|"recurring", "kind": "reminder"|"appointment" }
  Resolve "the 25th" to the next upcoming calendar date (today's year/month). Prefer kind "appointment" for doctor visits.
Otherwise set "action": null.

Return ONLY JSON:
{ "reply": string, "action": null | string | object, "memoryUpdates": string[] }
memoryUpdates: only safe personal preferences (foods, hobbies, likes) — never medical diagnoses.`;
}

function normalizeTalkAction(raw: unknown): TalkAction | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    const simple = ACTION_MAP[raw];
    return simple ? ({ type: simple } as TalkAction) : undefined;
  }
  if (typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const type = String(obj.type ?? "");
  if (type === "create_reminder") {
    const title = String(obj.title ?? "").trim();
    if (!title) return undefined;
    return {
      type: "create_reminder",
      title,
      date: typeof obj.date === "string" ? obj.date : undefined,
      time: typeof obj.time === "string" ? obj.time : undefined,
      days: typeof obj.days === "string" ? obj.days : "once",
      kind:
        obj.kind === "appointment" ||
        obj.kind === "medicine" ||
        obj.kind === "task" ||
        obj.kind === "reminder"
          ? obj.kind
          : "reminder",
    };
  }
  if (type === "open_routine") {
    return {
      type: "open_routine",
      date: typeof obj.date === "string" ? obj.date : undefined,
    };
  }
  const simple = ACTION_MAP[type];
  return simple ? ({ type: simple } as TalkAction) : undefined;
}

const ACTION_MAP: Record<string, Exclude<TalkAction["type"], "create_reminder">> = {
  open_medical: "open_medical",
  open_doctor_nearby: "open_doctor_nearby",
  open_shopping: "open_shopping",
  open_routine: "open_routine",
  open_emergency: "open_emergency",
  open_help: "open_help",
};

export async function generateTalkReply(input: TalkInput): Promise<TalkOutput> {
  // Prefer deterministic dated-reminder parsing before calling the model.
  const localReminder = parseReminderSpeech(
    input.message,
    aiPhrase(input.lang, "ai.reminderLabel"),
  );
  if (localReminder?.date || (localReminder && /\bremind\b/i.test(input.message))) {
    const fromLocal = localTalk(input);
    if (fromLocal.action?.type === "create_reminder") return fromLocal;
  }

  if (!hasAiApiKey()) return localTalk(input);

  try {
    const meta = languageByCode(input.lang);
    const today = toDateKey(new Date());
    const raw = await completeJsonChat({
      system: buildSystemPrompt(input.lang),
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: `Reply language MUST be ${meta.englishName} (${meta.htmlLang}, ${meta.nativeLabel}). User name: ${input.userName}. Known preferences: ${input.memory.join("; ") || "none"}. Today is ${today}. Chat freely about whatever they bring up.`,
        },
        ...input.history.slice(-16),
        { role: "user", content: input.message },
      ],
    });

    if (!raw) return localTalk(input);

    const parsed = JSON.parse(raw) as {
      reply?: string;
      action?: unknown;
      memoryUpdates?: string[];
    };

    const action = normalizeTalkAction(parsed.action);

    return {
      reply: parsed.reply || localTalk(input).reply,
      action,
      memoryUpdates: parsed.memoryUpdates,
    };
  } catch {
    return localTalk(input);
  }
}
