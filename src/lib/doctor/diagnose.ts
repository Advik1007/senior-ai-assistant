import "server-only";

import { runClinicalTriage, type TriageInput, type TriageResult } from "@/lib/doctor/triage-engine";

type AiDiagnosis = {
  urgency: TriageResult["urgency"];
  urgencyReason: string;
  clinicalSummary: string;
  differentials: TriageResult["differentials"];
  redFlags: string[];
  nextSteps: string[];
  suggestedQuestions: string[];
};

const SYSTEM = `You are UNK AI Clinical Reasoning Engine — an advanced medical triage assistant.
Return ONLY valid JSON with this shape:
{
  "urgency": "emergency" | "urgent" | "routine" | "self-care",
  "urgencyReason": string,
  "clinicalSummary": string,
  "differentials": [{ "condition": string, "probability": number, "category": string, "explanation": string }],
  "redFlags": string[],
  "nextSteps": string[],
  "suggestedQuestions": string[]
}
Rules:
- Provide 3-5 differential diagnoses with probability 5-90.
- Flag emergencies (stroke, MI, sepsis, PE) when appropriate.
- Never claim certainty. Always recommend licensed clinician confirmation.
- Respond ONLY in the user's selected language (field "lang"). Do not use English unless lang is "en".`;

export async function diagnoseSymptoms(
  input: TriageInput & { lang: string },
): Promise<TriageResult & { source: "ai" | "engine" }> {
  const apiKey = process.env.AI_API_KEY;
  const base = runClinicalTriage({ ...input, lang: input.lang });

  // Keep Hindi (and other non-English) on the localized rule engine so UI
  // chrome and clinical text stay in the same language.
  if (!apiKey || input.lang !== "en") {
    return { ...base, source: "engine" };
  }

  try {
    const userPayload = JSON.stringify({
      lang: input.lang,
      symptoms: input.symptomsText,
      selectedSymptoms: input.selectedSymptoms,
      duration: input.duration,
      severity: input.severity,
      ageGroup: input.ageGroup,
      engineBaseline: base,
    });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPayload },
        ],
      }),
    });

    if (!res.ok) {
      return { ...base, source: "engine" };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return { ...base, source: "engine" };

    const parsed = JSON.parse(raw) as AiDiagnosis;
    return {
      urgency: parsed.urgency ?? base.urgency,
      urgencyScore: base.urgencyScore,
      urgencyReason: parsed.urgencyReason ?? base.urgencyReason,
      clinicalSummary: parsed.clinicalSummary ?? base.clinicalSummary,
      differentials: parsed.differentials?.length
        ? parsed.differentials.slice(0, 5)
        : base.differentials,
      redFlags: parsed.redFlags?.length ? parsed.redFlags : base.redFlags,
      nextSteps: parsed.nextSteps?.length ? parsed.nextSteps : base.nextSteps,
      suggestedQuestions: parsed.suggestedQuestions?.length
        ? parsed.suggestedQuestions
        : base.suggestedQuestions,
      source: "ai",
    };
  } catch {
    return { ...base, source: "engine" };
  }
}
