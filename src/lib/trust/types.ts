export type TrustIntent =
  | "plan"
  | "prioritize"
  | "break_down"
  | "clarify"
  | "confirm_google"
  | "status"
  | "homework_help"
  | "plagiarism_check"
  | "compose_email";

export type TrustMode = "general" | "student";

export type PlanBlock = {
  start: string;
  end: string;
  date: string;
  title: string;
  task_ids: string[];
  success_criteria: string;
  kind: "focus" | "break" | "anchor" | "buffer";
};

export type TrustPriority = {
  id: string;
  title: string;
  urgency: number;
  impact: number;
  effort_minutes: number;
  depends_on: string[];
  score: number;
  rationale: string;
};

export type GoogleAction = {
  provider: string;
  service: "calendar" | "gmail" | string;
  operation: string;
  status: string;
  confirmation_prompt?: string;
  summary?: string;
  payload?: {
    events?: Array<{
      title: string;
      date: string;
      start: string;
      end: string;
      timezone: string;
      description?: string;
    }> | null;
    email?: {
      to: string[];
      cc: string[];
      subject: string;
      body: string;
    } | null;
  };
};

export type TrustEnvelope = {
  schema: "trust_ai_v1";
  intent: TrustIntent;
  mode: TrustMode;
  assistant_message: string;
  assumptions: string[];
  clarifying_questions: Array<{
    id: string;
    question: string;
    why_it_matters: string;
    default_if_skipped: string;
  }>;
  priorities: TrustPriority[];
  plan: {
    goal: string;
    time_window: string;
    blocks: PlanBlock[];
    must_do: string[];
    should_do: string[];
    park: string[];
    risks: string[];
    date?: string;
  } | null;
  breakdown: unknown;
  next_action: { summary: string; task_id: string; minutes: number } | null;
  google_action: GoogleAction | null;
  student: { hook: string; subjects?: string[] } | null;
  needs_user_confirmation: boolean;
};

export type TrustRuntime = {
  device: string;
  mps_available: boolean;
  model_id: string;
  reply_source: string;
  model_role: string;
  torch_version?: string;
};

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  status?: "streaming" | "complete" | "error";
  envelope?: TrustEnvelope | null;
  error?: string;
};
