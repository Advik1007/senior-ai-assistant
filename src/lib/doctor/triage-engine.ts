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
  lang?: string;
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
  weights: Record<string, number>;
  minScore?: number;
};

type ConditionCopy = {
  name: string;
  category: string;
  explanation: string;
};

type TriageCopy = {
  conditions: Record<string, ConditionCopy>;
  redFlags: Record<string, string>;
  reasons: Record<UrgencyLevel, string>;
  nextSteps: Record<"emergency" | "urgent" | "other", string[]>;
  discuss: (condition: string) => string;
  summary: (input: {
    clusters: number;
    duration: string;
    severity: number;
    top: string;
    reason: string;
  }) => string;
  durationLabel: Record<TriageInput["duration"], string>;
  nonSpecific: ConditionCopy;
  topFallback: string;
  suggestedQuestions: string[];
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
    weights: { chest_pain: 5, breathlessness: 3, dizziness: 2, anxiety: 1 },
    minScore: 5,
  },
  {
    id: "stroke",
    weights: { numbness: 5, dizziness: 3, headache: 2 },
    minScore: 5,
  },
  {
    id: "pneumonia",
    weights: { cough: 4, fever: 3, breathlessness: 3, chest_pain: 1 },
  },
  {
    id: "uri",
    weights: { cough: 3, fever: 2, throat: 3, fatigue: 2, headache: 1 },
  },
  {
    id: "migraine",
    weights: { headache: 5, dizziness: 2, nausea: 0 },
  },
  {
    id: "gerd",
    weights: { abdominal_pain: 4, chest_pain: 2, nausea: 2 },
  },
  {
    id: "uti",
    weights: { urinary: 5, fever: 2, abdominal_pain: 1 },
  },
  {
    id: "dehydration",
    weights: { dizziness: 3, fatigue: 3, fever: 2 },
  },
  {
    id: "osteoarthritis",
    weights: { joint_pain: 5, back_pain: 2 },
  },
  {
    id: "anxiety",
    weights: { anxiety: 5, chest_pain: 2, dizziness: 2, breathlessness: 2 },
  },
  {
    id: "pe",
    weights: { breathlessness: 4, chest_pain: 3, dizziness: 2 },
    minScore: 6,
  },
  {
    id: "sepsis",
    weights: { fever: 4, breathlessness: 2, dizziness: 2, abdominal_pain: 2 },
    minScore: 6,
  },
];

const RED_FLAG_RULES: Array<{
  id: string;
  match: string[];
  urgencyBoost: number;
}> = [
  { id: "chest_breath", match: ["chest_pain", "breathlessness"], urgencyBoost: 40 },
  { id: "numbness", match: ["numbness"], urgencyBoost: 45 },
  { id: "chest", match: ["chest_pain"], urgencyBoost: 30 },
  { id: "breath_fever", match: ["breathlessness", "fever"], urgencyBoost: 25 },
  { id: "fever", match: ["fever"], urgencyBoost: 10 },
];

const COPY_EN: TriageCopy = {
  conditions: {
    acs: {
      name: "Possible heart attack (acute coronary syndrome)",
      category: "Cardiac",
      explanation:
        "Chest discomfort with breathlessness can signal reduced blood flow to the heart.",
    },
    stroke: {
      name: "Possible stroke or TIA",
      category: "Neurological",
      explanation:
        "Sudden weakness, speech changes, or numbness on one side need emergency evaluation.",
    },
    pneumonia: {
      name: "Possible pneumonia or lower respiratory infection",
      category: "Respiratory",
      explanation:
        "Fever with cough and breathing difficulty may indicate lung infection.",
    },
    uri: {
      name: "Upper respiratory infection (common cold / flu)",
      category: "Respiratory",
      explanation: "Viral illness often causes cough, sore throat, and mild fever.",
    },
    migraine: {
      name: "Migraine or tension headache",
      category: "Neurological",
      explanation: "Throbbing head pain with sensitivity is common in migraine.",
    },
    gerd: {
      name: "Acid reflux / gastritis",
      category: "Gastrointestinal",
      explanation: "Burning stomach or chest discomfort after meals may be reflux.",
    },
    uti: {
      name: "Urinary tract infection",
      category: "Genitourinary",
      explanation: "Burning or frequent urination with fever can indicate UTI.",
    },
    dehydration: {
      name: "Dehydration or electrolyte imbalance",
      category: "General",
      explanation:
        "Low fluids can cause dizziness, weakness, especially with fever.",
    },
    osteoarthritis: {
      name: "Osteoarthritis flare",
      category: "Musculoskeletal",
      explanation: "Aching joints worse with movement is typical of arthritis.",
    },
    anxiety: {
      name: "Anxiety / panic symptoms",
      category: "Mental health",
      explanation:
        "Stress can mimic physical symptoms; still rule out cardiac causes if chest pain is new.",
    },
    pe: {
      name: "Possible pulmonary embolism",
      category: "Emergency",
      explanation: "Sudden breathlessness with chest pain needs urgent assessment.",
    },
    sepsis: {
      name: "Possible serious infection (sepsis risk)",
      category: "Emergency",
      explanation:
        "High fever with confusion or fast breathing can signal severe infection.",
    },
  },
  redFlags: {
    chest_breath:
      "Chest pain with breathing difficulty — seek emergency care immediately.",
    numbness:
      "Sudden numbness or weakness — stroke protocol; call emergency services.",
    chest: "New or severe chest pain should be evaluated urgently.",
    breath_fever: "Breathing difficulty with fever needs prompt medical review.",
    fever: "High or persistent fever — monitor closely and consult a doctor.",
  },
  reasons: {
    emergency: "Pattern suggests a possible emergency — do not wait.",
    urgent: "You should see a doctor within 24 hours.",
    routine: "Schedule a routine doctor visit when convenient.",
    "self-care":
      "Symptoms may be manageable with rest and home care, but monitor closely.",
  },
  nextSteps: {
    emergency: [
      "Call emergency services (112 / 911 / 108) now.",
      "Do not drive yourself if you feel faint or have chest pain.",
      "Chew aspirin only if already prescribed — ask emergency operator.",
    ],
    urgent: [
      "Contact your doctor or visit urgent care today.",
      "Keep a list of symptoms and when they started.",
      "Avoid strenuous activity until evaluated.",
    ],
    other: [
      "Rest, hydrate, and track symptoms twice daily.",
      "Book a nurse or doctor visit if symptoms worsen.",
      "Use UNK to book a blood test if your doctor recommends it.",
    ],
  },
  discuss: (condition) =>
    `Discuss "${condition}" with a licensed clinician.`,
  summary: ({ clusters, duration, severity, top, reason }) =>
    `Presentation: ${clusters} symptom cluster(s), ${duration} duration, severity ${severity}/10. Leading hypothesis: ${top}. ${reason}`,
  durationLabel: {
    hours: "hours",
    days: "days",
    weeks: "weeks",
    months: "months",
  },
  nonSpecific: {
    name: "Non-specific symptoms — clinical exam needed",
    category: "General",
    explanation:
      "Your description needs a physical examination for a reliable diagnosis.",
  },
  topFallback: "non-specific symptoms",
  suggestedQuestions: [
    "When did symptoms start and were they sudden or gradual?",
    "Any medicines taken recently or known allergies?",
    "Any chronic conditions (diabetes, heart disease, hypertension)?",
    "Any recent travel, surgery, or new medications?",
  ],
};

const COPY_HI: TriageCopy = {
  conditions: {
    acs: {
      name: "संभावित हृदयघात (एक्यूट कोरोनरी सिंड्रोम)",
      category: "हृदय संबंधी",
      explanation:
        "साँस लेने में तकलीफ के साथ सीने में दर्द हृदय तक रक्त प्रवाह कम होने का संकेत हो सकता है।",
    },
    stroke: {
      name: "संभावित स्ट्रोक या टीआईए",
      category: "तंत्रिका संबंधी",
      explanation:
        "अचानक कमजोरी, बोलने में बदलाव, या एक तरफ सुन्नपन पर तुरंत आपातकालीन जाँच ज़रूरी है।",
    },
    pneumonia: {
      name: "संभावित निमोनिया या निचला श्वसन संक्रमण",
      category: "श्वसन संबंधी",
      explanation:
        "बुखार के साथ खांसी और साँस लेने में तकलीफ फेफड़ों के संक्रमण का संकेत हो सकती है।",
    },
    uri: {
      name: "ऊपरी श्वसन संक्रमण (सर्दी / फ्लू)",
      category: "श्वसन संबंधी",
      explanation:
        "वायरल बीमारी में अक्सर खांसी, गले में दर्द और हल्का बुखार होता है।",
    },
    migraine: {
      name: "माइग्रेन या तनाव सिरदर्द",
      category: "तंत्रिका संबंधी",
      explanation:
        "धड़कन जैसा सिरदर्द और रोशनी/आवाज़ के प्रति संवेदनशीलता माइग्रेन में आम है।",
    },
    gerd: {
      name: "एसिड रिफ्लक्स / गैस्ट्राइटिस",
      category: "पाचन संबंधी",
      explanation:
        "खाने के बाद पेट या सीने में जलन रिफ्लक्स हो सकती है।",
    },
    uti: {
      name: "मूत्र मार्ग संक्रमण",
      category: "मूत्र संबंधी",
      explanation:
        "पेशाब में जलन या बार-बार पेशाब आना, बुखार के साथ यूटीआई हो सकता है।",
    },
    dehydration: {
      name: "डिहाइड्रेशन या इलेक्ट्रोलाइट असंतुलन",
      category: "सामान्य",
      explanation:
        "पानी की कमी से चक्कर और कमजोरी हो सकती है, खासकर बुखार में।",
    },
    osteoarthritis: {
      name: "ऑस्टियोआर्थराइटिस का बढ़ना",
      category: "हड्डी-जोड़",
      explanation:
        "हलचल पर बढ़ने वाला जोड़ों का दर्द गठिया में आम है।",
    },
    anxiety: {
      name: "चिंता / पैनिक के लक्षण",
      category: "मानसिक स्वास्थ्य",
      explanation:
        "तनाव शारीरिक लक्षण जैसा लग सकता है; नया सीने का दर्द हो तो हृदय जाँच भी करवाएँ।",
    },
    pe: {
      name: "संभावित पल्मोनरी एम्बोलिज़्म",
      category: "आपातकाल",
      explanation:
        "अचानक साँस फूलना और सीने में दर्द पर तुरंत जाँच ज़रूरी है।",
    },
    sepsis: {
      name: "संभावित गंभीर संक्रमण (सेप्सिस जोखिम)",
      category: "आपातकाल",
      explanation:
        "तेज़ बुखार के साथ भ्रम या तेज़ साँस गंभीर संक्रमण का संकेत हो सकता है।",
    },
  },
  redFlags: {
    chest_breath:
      "सीने में दर्द और साँस लेने में तकलीफ — तुरंत आपातकालीन सहायता लें।",
    numbness:
      "अचानक सुन्नपन या कमजोरी — स्ट्रोक प्रोटोकॉल; आपातकालीन सेवाएँ कॉल करें।",
    chest: "नया या तेज़ सीने का दर्द तुरंत जाँच करवाएँ।",
    breath_fever:
      "बुखार के साथ साँस लेने में तकलीफ पर जल्दी डॉक्टर से मिलें।",
    fever: "तेज़ या लगातार बुखार — नज़र रखें और डॉक्टर से सलाह लें।",
  },
  reasons: {
    emergency: "लक्षण आपातकाल का संकेत दे सकते हैं — प्रतीक्षा न करें।",
    urgent: "24 घंटे के अंदर डॉक्टर से मिलें।",
    routine: "सुविधा अनुसार नियमित डॉक्टर विज़िट तय करें।",
    "self-care":
      "आराम और घरेलू देखभाल से ठीक हो सकते हैं, लेकिन लक्षणों पर नज़र रखें।",
  },
  nextSteps: {
    emergency: [
      "अभी आपातकालीन सेवाएँ कॉल करें (112 / 911 / 108)।",
      "अगर चक्कर आ रहे हों या सीने में दर्द हो तो खुद गाड़ी न चलाएँ।",
      "एस्पिरिन तभी चबाएँ जब पहले से डॉक्टर ने बताया हो — ऑपरेटर से पूछें।",
    ],
    urgent: [
      "आज ही अपने डॉक्टर या आपातकालीन क्लीनिक से संपर्क करें।",
      "लक्षण और कब शुरू हुए, इसकी सूची बनाकर रखें।",
      "जाँच होने तक भारी मेहनत वाला काम न करें।",
    ],
    other: [
      "आराम करें, पानी पिएँ, और दिन में दो बार लक्षण लिखें।",
      "लक्षण बिगड़ें तो नर्स या डॉक्टर से मिलें।",
      "डॉक्टर सलाह दें तो UNK से ब्लड टेस्ट बुक कर सकते हैं।",
    ],
  },
  discuss: (condition) =>
    `"${condition}" के बारे में लाइसेंस प्राप्त डॉक्टर से चर्चा करें।`,
  summary: ({ clusters, duration, severity, top, reason }) =>
    `प्रस्तुति: ${clusters} लक्षण समूह, अवधि ${duration}, तीव्रता ${severity}/10। मुख्य संभावना: ${top}। ${reason}`,
  durationLabel: {
    hours: "घंटे",
    days: "दिन",
    weeks: "सप्ताह",
    months: "महीने",
  },
  nonSpecific: {
    name: "अस्पष्ट लक्षण — शारीरिक जाँच ज़रूरी",
    category: "सामान्य",
    explanation:
      "विश्वसनीय निदान के लिए डॉक्टर की शारीरिक जाँच आवश्यक है।",
  },
  topFallback: "अस्पष्ट लक्षण",
  suggestedQuestions: [
    "लक्षण कब शुरू हुए — अचानक या धीरे-धीरे?",
    "हाल में कोई दवा ली या कोई एलर्जी है?",
    "कोई पुरानी बीमारी (मधुमेह, हृदय रोग, उच्च रक्तचाप)?",
    "हाल में यात्रा, सर्जरी, या नई दवाएँ?",
  ],
};

function getCopy(lang?: string): TriageCopy {
  return lang === "hi" ? COPY_HI : COPY_EN;
}

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
  // Map English chip labels from the UI to symptom keys
  const chipMap: Record<string, string> = {
    fever: "fever",
    headache: "headache",
    cough: "cough",
    "chest pain": "chest_pain",
    dizziness: "dizziness",
    "stomach pain": "abdominal_pain",
    बुखार: "fever",
    सिरदर्द: "headache",
    खांसी: "cough",
    "सीने में दर्द": "chest_pain",
    चक्कर: "dizziness",
    "पेट दर्द": "abdominal_pain",
  };
  for (const chip of selected) {
    const key = chipMap[normalize(chip)] ?? chipMap[chip];
    if (key) found.add(key);
  }
  return found;
}

function scoreConditions(
  symptoms: Set<string>,
  severity: number,
  copy: TriageCopy,
): Differential[] {
  const scored: Differential[] = [];

  for (const rule of CONDITIONS) {
    let score = 0;
    for (const s of symptoms) {
      score += rule.weights[s] ?? 0;
    }
    if (rule.minScore && score < rule.minScore) continue;
    if (score <= 0) continue;

    const text = copy.conditions[rule.id];
    if (!text) continue;

    const probability = Math.min(
      92,
      Math.round((score / 8) * 55 + severity * 3 + 12),
    );

    scored.push({
      condition: text.name,
      probability,
      category: text.category,
      explanation: text.explanation,
    });
  }

  return scored.sort((a, b) => b.probability - a.probability).slice(0, 5);
}

function computeUrgency(
  symptoms: Set<string>,
  severity: number,
  ageGroup: TriageInput["ageGroup"],
  copy: TriageCopy,
): { level: UrgencyLevel; score: number; reason: string; redFlags: string[] } {
  let score = severity * 6;
  const redFlags: string[] = [];

  if (ageGroup === "65plus") score += 8;

  for (const rule of RED_FLAG_RULES) {
    if (rule.match.every((s) => symptoms.has(s))) {
      redFlags.push(copy.redFlags[rule.id] ?? "");
      score += rule.urgencyBoost;
    }
  }

  if (symptoms.has("chest_pain") || symptoms.has("numbness")) score += 20;
  if (symptoms.has("breathlessness") && severity >= 7) score += 15;

  let level: UrgencyLevel = "self-care";
  if (score >= 70) level = "emergency";
  else if (score >= 45) level = "urgent";
  else if (score >= 25) level = "routine";

  return {
    level,
    score,
    reason: copy.reasons[level],
    redFlags: redFlags.filter(Boolean),
  };
}

function buildNextSteps(
  urgency: UrgencyLevel,
  differentials: Differential[],
  copy: TriageCopy,
): string[] {
  const key =
    urgency === "emergency"
      ? "emergency"
      : urgency === "urgent"
        ? "urgent"
        : "other";
  const steps = [...copy.nextSteps[key]];
  if (differentials[0]) {
    steps.push(copy.discuss(differentials[0].condition));
  }
  return steps;
}

export function runClinicalTriage(input: TriageInput): TriageResult {
  const copy = getCopy(input.lang);
  const symptoms = detectSymptoms(input.symptomsText, input.selectedSymptoms);
  const differentials = scoreConditions(symptoms, input.severity, copy);
  const { level, score, reason, redFlags } = computeUrgency(
    symptoms,
    input.severity,
    input.ageGroup,
    copy,
  );

  const top = differentials[0]?.condition ?? copy.topFallback;
  const clinicalSummary = copy.summary({
    clusters: symptoms.size,
    duration: copy.durationLabel[input.duration],
    severity: input.severity,
    top,
    reason,
  });

  return {
    urgency: level,
    urgencyScore: score,
    urgencyReason: reason,
    differentials:
      differentials.length > 0
        ? differentials
        : [
            {
              condition: copy.nonSpecific.name,
              probability: 40,
              category: copy.nonSpecific.category,
              explanation: copy.nonSpecific.explanation,
            },
          ],
    redFlags,
    nextSteps: buildNextSteps(level, differentials, copy),
    clinicalSummary,
    suggestedQuestions: copy.suggestedQuestions,
  };
}
