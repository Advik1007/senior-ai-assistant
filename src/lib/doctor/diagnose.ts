import "server-only";

import { completeJsonChat, hasAiApiKey } from "@/lib/ai/provider";
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
  const base = runClinicalTriage({ ...input, lang: input.lang });

  if (!hasAiApiKey()) {
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

    const raw = await completeJsonChat({
      system: SYSTEM,
      temperature: 0.2,
      messages: [{ role: "user", content: userPayload }],
    });

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
