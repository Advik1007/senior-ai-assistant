import type { Contact } from "@/lib/db/schema";
import type { ToolCall } from "@/lib/ai/tools";
import {
  findContactByName,
  findContactByRelationship,
} from "@/lib/storage/contacts";

export type AssistantResult = {
  spokenText: string;
  toolCall?: ToolCall;
  /** If UNK cannot help, offer a family call. */
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

/**
 * Small on-device interpreter for this first version.
 * A later step can swap this for a server-side model that returns
 * the same ToolCall objects (API keys stay on the server).
 */
export function interpretUserSpeech(
  raw: string,
  contacts: Contact[],
): AssistantResult {
  const text = raw.trim().toLowerCase();

  if (!text) {
    return { spokenText: "I did not hear that. Please say it again." };
  }

  if (/^(yes|yeah|yep|ok|okay|sure|haan|ji|please do)\b/.test(text)) {
    return { spokenText: "YES_CONFIRM" };
  }
  if (/^(no|nope|nah|don't|do not|cancel|nahi)\b/.test(text)) {
    return { spokenText: "NO_CONFIRM" };
  }

  if (includesAny(text, ["call", "phone", "dial", "ring"])) {
    for (const rel of RELATIONSHIPS) {
      if (text.includes(rel) || text.includes(`my ${rel}`)) {
        const contact = findContactByRelationship(contacts, rel);
        if (contact) {
          return {
            spokenText: `Do you want me to call ${contact.name}?`,
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
          spokenText: `Do you want me to call ${contact.name}?`,
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
          spokenText: `Do you want me to call ${byName.name}?`,
          toolCall: {
            name: "call_family_member",
            args: { name: byName.name },
          },
        };
      }
    }
    return {
      spokenText:
        "I could not find that family member. Open Call Family to add their number.",
    };
  }

  if (includesAny(text, ["cab", "taxi", "uber", "ola", "auto"])) {
    return {
      spokenText:
        "I can help look for a cab. Cab booking needs an authorized company API before any ride can be booked.",
      toolCall: { name: "search_cabs", args: {} },
    };
  }

  if (includesAny(text, ["flight", "plane", "airport", "fly"])) {
    return {
      spokenText:
        "I can help look for a flight. Flight booking needs an authorized airline or travel API before any ticket can be bought.",
      toolCall: { name: "search_flights", args: {} },
    };
  }

  if (includesAny(text, ["bill", "electricity", "water", "bijli", "paani"])) {
    const billType = text.includes("water") || text.includes("paani")
      ? "water"
      : "electricity";
    return {
      spokenText:
        "I can help with utility bills. Paying a bill needs an authorized bill-pay API. UNK will never pay without you confirming twice.",
      toolCall: { name: "search_bill_options", args: { billType } },
    };
  }

  if (includesAny(text, ["nurse", "caregiver", "caretaker", "home care"])) {
    return {
      spokenText:
        "I can help find a home-care nurse. This is not medical advice. Booking needs an authorized healthcare API.",
      toolCall: { name: "search_nurse_services", args: {} },
    };
  }

  if (includesAny(text, ["blood test", "blood", "lab", "pathology"])) {
    return {
      spokenText:
        "I can help find a blood test. This is not medical advice. Booking needs an authorized lab API.",
      toolCall: { name: "search_blood_tests", args: {} },
    };
  }

  return {
    spokenText:
      "I am not sure how to help with that yet. Would you like me to call a family member?",
    offerFamilyCall: true,
  };
}
