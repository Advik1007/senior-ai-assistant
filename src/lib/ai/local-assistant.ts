import type { Contact } from "@/lib/db/schema";
import { aiPhrase } from "@/lib/ai/phrases";
import type { ToolCall } from "@/lib/ai/tools";
import type { AppLanguage } from "@/lib/languages";
import {
  findContactByName,
  findContactByRelationship,
} from "@/lib/storage/contacts";
import { addRoutine } from "@/lib/storage/routines";

export type AssistantResult = {
  spokenText: string;
  toolCall?: ToolCall;
  offerFamilyCall?: boolean;
};

const RELATIONSHIPS = [
  "son",
  "daughter",
  "brother",
  "sister",
  "spouse",
  "grandchild",
  "friend",
];

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function extractWhen(text: string): string | undefined {
  const match = text.match(
    /\b(tomorrow.*|today.*|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|every\s+\w+)/i,
  );
  return match?.[1]?.trim();
}

function extractDestination(text: string): string | undefined {
  const patterns = [
    /\bto\s+(?:the\s+)?(.+?)(?:\s+by\s+|\s+on\s+foot|$)/i,
    /\bget to\s+(?:the\s+)?(.+?)$/i,
    /\bhow do i (?:get|go) to\s+(?:the\s+)?(.+?)$/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

function travelMode(text: string): "walking" | "driving" | "transit" | "bicycling" {
  if (includesAny(text, ["walk", "walking", "foot", "पैदल", "પગપાળા"])) return "walking";
  if (includesAny(text, ["bus", "train", "metro", "transit", "बस", "બસ"])) return "transit";
  if (includesAny(text, ["bike", "bicycle", "cycle", "साइकिल"])) return "bicycling";
  return "driving";
}

export function interpretUserSpeech(
  raw: string,
  contacts: Contact[],
  lang: AppLanguage = "en",
): AssistantResult {
  const text = raw.trim().toLowerCase();
  const say = (key: Parameters<typeof aiPhrase>[1], vars?: Record<string, string>) =>
    aiPhrase(lang, key, vars);

  if (!text) {
    return { spokenText: say("ai.didNotHear") };
  }

  if (
    /^(yes|yeah|yep|ok|okay|sure|haan|haa|ji|please do|हाँ|હા|ஆம்|అవును|ಹೌದು|അതെ|ਹਾਂ|جی|ହଁ|হয়|हो)\b/i.test(
      text,
    )
  ) {
    return { spokenText: "YES_CONFIRM" };
  }
  if (
    /^(no|nope|nah|don't|do not|cancel|nahi|नहीं|ના|இல்லை|కాదు|ಇಲ್ಲ|ഇല്ല|ਨਹੀਂ|نہیں|ନା|না|होइन)\b/i.test(
      text,
    )
  ) {
    return { spokenText: "NO_CONFIRM" };
  }

  if (
    includesAny(text, [
      "emergency",
      "ambulance",
      "police",
      "fire",
      "help me now",
      "आपात",
      "एम्बुलेंस",
      "કટોકટી",
      "એમ્બ્યુલન્સ",
    ])
  ) {
    return {
      spokenText: say("ai.emergency"),
      toolCall: { name: "open_emergency", args: {} },
    };
  }

  if (
    includesAny(text, [
      "call",
      "phone",
      "dial",
      "ring",
      "कॉल",
      "फोन",
      "કૉલ",
      "ફોન",
    ])
  ) {
    for (const rel of RELATIONSHIPS) {
      if (text.includes(rel) || text.includes(`my ${rel}`)) {
        const contact = findContactByRelationship(contacts, rel);
        if (contact) {
          return {
            spokenText: say("ai.confirmCall", { name: contact.name }),
            toolCall: {
              name: "call_family_member",
              args: { relationship: rel, name: contact.name },
            },
          };
        }
      }
    }
    for (const contact of contacts) {
      if (text.includes(contact.name.toLowerCase())) {
        return {
          spokenText: say("ai.confirmCall", { name: contact.name }),
          toolCall: {
            name: "call_family_member",
            args: { name: contact.name },
          },
        };
      }
    }
    const named = text.match(/call\s+(?:my\s+)?([a-z]+)/i);
    if (named?.[1]) {
      const byName = findContactByName(contacts, named[1]);
      if (byName) {
        return {
          spokenText: say("ai.confirmCall", { name: byName.name }),
          toolCall: {
            name: "call_family_member",
            args: { name: byName.name },
          },
        };
      }
    }
    return { spokenText: say("ai.noContact") };
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
    return {
      spokenText: say("ai.shopping"),
      toolCall: { name: "open_shopping", args: {} },
    };
  }

  if (
    includesAny(text, [
      "remind me",
      "reminder",
      "every morning",
      "every day",
      "every sunday",
      "याद दिला",
      "યાદ અપાવ",
    ])
  ) {
    const when = extractWhen(text);
    const title =
      text.replace(/remind me\s+(?:to\s+)?/i, "").trim() ||
      say("ai.reminderLabel");
    if (when) {
      addRoutine({
        title: title.slice(0, 120),
        time: when,
        days: text.includes("every") ? "recurring" : "once",
        kind: "reminder",
      });
    }
    return {
      spokenText: when
        ? say("ai.reminderSaved", { when })
        : say("ai.openRoutine"),
      toolCall: { name: "open_routine", args: {} },
    };
  }

  if (
    includesAny(text, [
      "routine",
      "schedule",
      "tomorrow",
      "what's my day",
      "calendar",
      "दिनचर्या",
      "દિનચર્યા",
    ])
  ) {
    return {
      spokenText: say("ai.hereRoutine"),
      toolCall: { name: "open_routine", args: {} },
    };
  }

  if (
    includesAny(text, [
      "direction",
      "how do i get",
      "how to get",
      "navigate",
      "maps",
      "hospital",
      "रास्ता",
      "રસ્તો",
    ])
  ) {
    const destination = extractDestination(text) || "hospital";
    return {
      spokenText: say("ai.directions", { destination }),
      toolCall: {
        name: "open_directions",
        args: { destination, mode: travelMode(text) },
      },
    };
  }

  if (
    includesAny(text, [
      "doctor",
      "clinic",
      "symptom",
      "pain",
      "fever",
      "sick",
      "headache",
      "medicine",
      "medical",
      "दर्द",
      "बुखार",
      "डॉक्टर",
      "दवा",
      "દવા",
      "ડૉક્ટર",
    ])
  ) {
    if (
      includesAny(text, [
        "near",
        "nearby",
        "close",
        "find",
        "where",
        "recommend",
        "पास",
        "નજીક",
      ])
    ) {
      return {
        spokenText: say("ai.doctorsNearby"),
        toolCall: { name: "open_doctor_nearby", args: {} },
      };
    }
    return {
      spokenText: say("ai.openMedical"),
      toolCall: { name: "open_medical", args: {} },
    };
  }

  if (
    includesAny(text, [
      "help",
      "stuck",
      "trouble",
      "don't know how",
      "मदद",
      "મદદ",
    ])
  ) {
    return {
      spokenText: say("ai.needHelp"),
      toolCall: { name: "open_help", args: {} },
    };
  }

  return {
    spokenText: "",
    offerFamilyCall: false,
  };
}
