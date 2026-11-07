"use client";

import { Wordmark } from "@/components/trust/brand/Wordmark";

const STARTERS = [
  {
    id: "study",
    label: "Study plan",
    prompt:
      "Chem chapter 4, essay outline, and Spanish vocab — 3 hours tonight, quiz tomorrow.",
  },
  {
    id: "break",
    label: "Break down tasks",
    prompt: "Break down: finish math problem set due Friday (~12 problems).",
  },
  {
    id: "week",
    label: "Check my week",
    prompt: "This week: history paper Fri, team meeting Wed 4pm, grocery run, reply to teacher.",
  },
] as const;

type Props = {
  onStarter: (prompt: string) => void;
  reducedMotion: boolean;
};

export function EmptyState({ onStarter, reducedMotion }: Props) {
  return (
    <div
      className={cnEmpty(reducedMotion)}
      data-trust-empty
    >
      <Wordmark size="hero" />
      <h1 className="trust-empty-headline mt-6 max-w-xl font-[family-name:var(--trust-font-display)] text-[clamp(1.45rem,4.2vw,2.15rem)] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--trust-ink)]">
        What should we organize?
      </h1>
      <p className="mt-3 max-w-md text-[1.05rem] leading-relaxed text-[var(--trust-ink-muted)]">
        Paste subjects and deadlines — I’ll structure the day.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onStarter(s.prompt)}
            className="rounded-[var(--trust-radius)] border border-[var(--trust-line)] bg-[var(--trust-elevated)]/70 px-3.5 py-2 text-sm font-medium text-[var(--trust-ink)] transition hover:border-[var(--trust-accent)]/40 hover:bg-[var(--trust-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--trust-accent-soft)]"
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs tracking-wide text-[var(--trust-ink-muted)]">
        Student mode hooks ready — planning first; Calendar via Google after confirm.
      </p>
    </div>
  );
}

function cnEmpty(reduced: boolean) {
  return [
    "mx-auto flex w-full max-w-2xl flex-col items-start justify-center px-1 pb-8 pt-6 sm:pt-10",
    reduced ? "" : "trust-enter",
  ].join(" ");
}
