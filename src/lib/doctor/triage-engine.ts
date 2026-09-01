/**
 * Advanced clinical triage engine for UNK AI Doctor.
 * Produces differential diagnoses and urgency — NOT a substitute for a real doctor.
 */

export type UrgencyLevel = "emergency" | "urgent" | "routine" | "self-care";

export type Differential = {
  condition: string;
  probability: number;
  category: string;
  explanation: string;
};

export type TriageInput = {
  symptomsText: string;
  duration: "hours" | "days" | "weeks" | "months";
  severity: number;
  ageGroup: "under40" | "40to64" | "65plus";
  selectedSymptoms: string[];
};

export type TriageResult = {
  urgency: UrgencyLevel;
  urgencyScore: number;
  urgencyReason: string;
  differentials: Differential[];
  redFlags: string[];
  nextSteps: string[];
  clinicalSummary: string;
  suggestedQuestions: string[];
};

type ConditionRule = {
  id: string;
  name: string;
  category: string;
  weights: Record<string, number>;
  explanation: string;
  minScore?: number;
};

const SYMPTOM_ALIASES: Record<string, string[]> = {
  chest_pain: [
    "chest pain",
    "chest tight",
    "chest pressure",
    "सीने में दर्द",
    "छाती में दर्द",
    "heart pain",
  ],
  breathlessness: [
    "shortness of breath",
    "breathless",
    "can't breathe",
    "सांस",
    "breathing difficulty",
    "wheezing",
  ],
  fever: ["fever", "temperature", "बुखार", "hot", "chills", "ठंड लग"],
  headache: ["headache", "head pain", "सिरदर्द", "migraine"],
  cough: ["cough", "खांसी", "coughing", "phlegm"],
  abdominal_pain: [
    "stomach pain",
    "abdominal",
    "belly pain",
    "पेट दर्द",
    "nausea",
    "vomiting",
    "उल्टी",
  ],
  dizziness: ["dizzy", "dizziness", "चक्कर", "vertigo", "faint", "lightheaded"],
  fatigue: ["tired", "fatigue", "weakness", "कमजोरी", "exhausted"],
  joint_pain: ["joint", "arthritis", "knee pain", "जोड़ों का दर्द"],
  urinary: ["urine", "burning urine", "पेशाब", "frequent urination"],
  rash: ["rash", "skin", "चकत्ते", "itching", "खुजली"],
  numbness: ["numb", "tingling", "सुन्न", "weakness one side", "slurred speech"],
  throat: ["sore throat", "गले में दर्द", "swallow"],
  back_pain: ["back pain", "पीठ दर्द", "lower back"],
  anxiety: ["anxiety", "panic", "चिंता", "stress", "palpitations"],
};

const CONDITIONS: ConditionRule[] = [
  {
    id: "acs",
    name: "Possible heart attack (acute coronary syndrome)",
    category: "Cardiac",
    weights: { chest_pain: 5, breathlessness: 3, dizziness: 2, anxiety: 1 },
    explanation:
      "Chest discomfort with breathlessness can signal reduced blood flow to the heart.",
    minScore: 5,
  },
  {
    id: "stroke",
    name: "Possible stroke or TIA",
    category: "Neurological",
    weights: { numbness: 5, dizziness: 3, headache: 2 },
    explanation:
      "Sudden weakness, speech changes, or numbness on one side need emergency evaluation.",
    minScore: 5,
  },
  {
    id: "pneumonia",
    name: "Possible pneumonia or lower respiratory infection",
    category: "Respiratory",
    weights: { cough: 4, fever: 3, breathlessness: 3, chest_pain: 1 },
    explanation: "Fever with cough and breathing difficulty may indicate lung infection.",
  },
  {
    id: "uri",
    name: "Upper respiratory infection (common cold / flu)",
    category: "Respiratory",
    weights: { cough: 3, fever: 2, throat: 3, fatigue: 2, headache: 1 },
    explanation: "Viral illness often causes cough, sore throat, and mild fever.",
  },
  {
    id: "migraine",
    name: "Migraine or tension headache",
    category: "Neurological",
    weights: { headache: 5, dizziness: 2, nausea: 0 },
    explanation: "Throbbing head pain with sensitivity is common in migraine.",
  },
  {
    id: "gerd",
    name: "Acid reflux / gastritis",
    category: "Gastrointestinal",
    weights: { abdominal_pain: 4, chest_pain: 2, nausea: 2 },
    explanation: "Burning stomach or chest discomfort after meals may be reflux.",
  },
  {
    id: "uti",
    name: "Urinary tract infection",
    category: "Genitourinary",
    weights: { urinary: 5, fever: 2, abdominal_pain: 1 },
    explanation: "Burning or frequent urination with fever can indicate UTI.",
  },
  {
    id: "dehydration",
    name: "Dehydration or electrolyte imbalance",
    category: "General",
    weights: { dizziness: 3, fatigue: 3, fever: 2 },
    explanation: "Low fluids can cause dizziness, weakness, especially with fever.",
  },
  {
    id: "osteoarthritis",
    name: "Osteoarthritis flare",
    category: "Musculoskeletal",
    weights: { joint_pain: 5, back_pain: 2 },
    explanation: "Aching joints worse with movement is typical of arthritis.",
  },
  {
    id: "anxiety",
    name: "Anxiety / panic symptoms",
    category: "Mental health",
    weights: { anxiety: 5, chest_pain: 2, dizziness: 2, breathlessness: 2 },
    explanation:
      "Stress can mimic physical symptoms; still rule out cardiac causes if chest pain is new.",
  },
  {
    id: "pe",
    name: "Possible pulmonary embolism",
    category: "Emergency",
    weights: { breathlessness: 4, chest_pain: 3, dizziness: 2 },
    explanation: "Sudden breathlessness with chest pain needs urgent assessment.",
    minScore: 6,
  },
  {
    id: "sepsis",
    name: "Possible serious infection (sepsis risk)",
    category: "Emergency",
    weights: { fever: 4, breathlessness: 2, dizziness: 2, abdominal_pain: 2 },
    explanation: "High fever with confusion or fast breathing can signal severe infection.",
    minScore: 6,
  },
];

const RED_FLAG_RULES: Array<{
  match: string[];
  message: string;
  urgencyBoost: number;
}> = [
  {
    match: ["chest_pain", "breathlessness"],
    message: "Chest pain with breathing difficulty — seek emergency care immediately.",
    urgencyBoost: 40,
  },
  {
    match: ["numbness"],
    message: "Sudden numbness or weakness — stroke protocol; call emergency services.",
    urgencyBoost: 45,
  },
  {
    match: ["chest_pain"],
    message: "New or severe chest pain should be evaluated urgently.",
    urgencyBoost: 30,
  },
  {
    match: ["breathlessness", "fever"],
    message: "Breathing difficulty with fever needs prompt medical review.",
    urgencyBoost: 25,
  },
  {
    match: ["fever"],
    message: "High or persistent fever — monitor closely and consult a doctor.",
    urgencyBoost: 10,
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function detectSymptoms(text: string, selected: string[]): Set<string> {
  const found = new Set<string>(selected);
  const blob = normalize(text);
  for (const [key, aliases] of Object.entries(SYMPTOM_ALIASES)) {
    if (aliases.some((a) => blob.includes(normalize(a)))) {
      found.add(key);
    }
  }
  return found;
}

function scoreConditions(symptoms: Set<string>, severity: number): Differential[] {
  const scored: Differential[] = [];

  for (const rule of CONDITIONS) {
    let score = 0;
    for (const s of symptoms) {
      score += rule.weights[s] ?? 0;
    }
    if (rule.minScore && score < rule.minScore) continue;
    if (score <= 0) continue;

    const probability = Math.min(
      92,
      Math.round((score / 8) * 55 + severity * 3 + 12),
    );

    scored.push({
      condition: rule.name,
      probability,
      category: rule.category,
      explanation: rule.explanation,
    });
  }

  return scored.sort((a, b) => b.probability - a.probability).slice(0, 5);
}

function computeUrgency(
  symptoms: Set<string>,
  severity: number,
  ageGroup: TriageInput["ageGroup"],
): { level: UrgencyLevel; score: number; reason: string; redFlags: string[] } {
  let score = severity * 6;
  const redFlags: string[] = [];

  if (ageGroup === "65plus") score += 8;

  for (const rule of RED_FLAG_RULES) {
    if (rule.match.every((s) => symptoms.has(s))) {
      redFlags.push(rule.message);
      score += rule.urgencyBoost;
    }
  }

  if (symptoms.has("chest_pain") || symptoms.has("numbness")) score += 20;
  if (symptoms.has("breathlessness") && severity >= 7) score += 15;

  let level: UrgencyLevel = "self-care";
  let reason = "Symptoms may be manageable with rest and home care, but monitor closely.";

  if (score >= 70) {
    level = "emergency";
    reason = "Pattern suggests a possible emergency — do not wait.";
  } else if (score >= 45) {
    level = "urgent";
    reason = "You should see a doctor within 24 hours.";
  } else if (score >= 25) {
    level = "routine";
    reason = "Schedule a routine doctor visit when convenient.";
  }

  return { level, score, reason, redFlags };
}

function buildNextSteps(
  urgency: UrgencyLevel,
  differentials: Differential[],
): string[] {
  const steps: string[] = [];

  if (urgency === "emergency") {
    steps.push("Call emergency services (112 / 911 / 108) now.");
    steps.push("Do not drive yourself if you feel faint or have chest pain.");
    steps.push("Chew aspirin only if already prescribed — ask emergency operator.");
  } else if (urgency === "urgent") {
    steps.push("Contact your doctor or visit urgent care today.");
    steps.push("Keep a list of symptoms and when they started.");
    steps.push("Avoid strenuous activity until evaluated.");
  } else {
    steps.push("Rest, hydrate, and track symptoms twice daily.");
    steps.push("Book a nurse or doctor visit if symptoms worsen.");
    steps.push("Use UNK to book a blood test if your doctor recommends it.");
  }

  if (differentials[0]) {
    steps.push(`Discuss "${differentials[0].condition}" with a licensed clinician.`);
  }

  return steps;
}

export function runClinicalTriage(input: TriageInput): TriageResult {
  const symptoms = detectSymptoms(input.symptomsText, input.selectedSymptoms);
  const differentials = scoreConditions(symptoms, input.severity);
  const { level, score, reason, redFlags } = computeUrgency(
    symptoms,
    input.severity,
    input.ageGroup,
  );

  const top = differentials[0]?.condition ?? "non-specific symptoms";
  const clinicalSummary = `Presentation: ${symptoms.size} symptom cluster(s), ${input.duration} duration, severity ${input.severity}/10. Leading hypothesis: ${top}. ${reason}`;

  const suggestedQuestions = [
    "When did symptoms start and were they sudden or gradual?",
    "Any medicines taken recently or known allergies?",
    "Any chronic conditions (diabetes, heart disease, hypertension)?",
    "Any recent travel, surgery, or new medications?",
  ];

  return {
    urgency: level,
    urgencyScore: score,
    urgencyReason: reason,
    differentials:
      differentials.length > 0
        ? differentials
        : [
            {
              condition: "Non-specific symptoms — clinical exam needed",
              probability: 40,
              category: "General",
              explanation:
                "Your description needs a physical examination for a reliable diagnosis.",
            },
          ],
    redFlags,
    nextSteps: buildNextSteps(level, differentials),
    clinicalSummary,
    suggestedQuestions,
  };
}
