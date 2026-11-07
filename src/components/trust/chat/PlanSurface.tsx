"use client";

import type { TrustEnvelope } from "@/lib/trust/types";

type Props = {
  envelope: TrustEnvelope;
  onAddToCalendar?: () => void;
  onConfirmGoogle?: () => void;
  onCancelGoogle?: () => void;
};

export function PlanSurface({
  envelope,
  onAddToCalendar,
  onConfirmGoogle,
  onCancelGoogle,
}: Props) {
  const plan = envelope.plan;
  const google = envelope.google_action;

  if (google?.status === "awaiting_confirmation") {
    const events = google.payload?.events ?? [];
    return (
      <div className="trust-plan mt-3 overflow-hidden rounded-[var(--trust-radius)] border border-[var(--trust-line)] bg-[var(--trust-elevated)]/80">
        <div className="border-b border-[var(--trust-line)] px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--trust-accent)] uppercase">
            Confirm Google action
          </p>
          <p className="mt-1 text-sm text-[var(--trust-ink)]">
            {google.service === "calendar" ? "Calendar" : "Gmail"} ·{" "}
            {google.operation.replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-sm text-[var(--trust-ink-muted)]">
            {google.summary ?? "Review payload, then confirm."}
          </p>
        </div>
        {events.length > 0 ? (
          <ul className="divide-y divide-[var(--trust-line)]">
            {events.map((ev) => (
              <li key={`${ev.title}-${ev.start}`} className="px-4 py-3 text-sm">
                <p className="font-medium text-[var(--trust-ink)]">{ev.title}</p>
                <p className="text-[var(--trust-ink-muted)]">
                  {ev.date} · {ev.start}–{ev.end}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-2 border-t border-[var(--trust-line)] px-4 py-3">
          <button
            type="button"
            onClick={onConfirmGoogle}
            className="rounded-[calc(var(--trust-radius)-2px)] bg-[var(--trust-accent)] px-3.5 py-2 text-sm font-semibold text-[var(--trust-accent-ink)]"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={onCancelGoogle}
            className="rounded-[calc(var(--trust-radius)-2px)] border border-[var(--trust-line)] px-3.5 py-2 text-sm font-medium text-[var(--trust-ink)]"
          >
            Cancel
          </button>
        </div>
        <p className="px-4 pb-3 text-xs text-[var(--trust-ink-muted)]">
          Trust AI will not call Gemini until you confirm.
        </p>
      </div>
    );
  }

  if (!plan) return null;

  const focusBlocks = plan.blocks.filter((b) => b.kind === "focus");

  return (
    <div className="trust-plan mt-3 overflow-hidden rounded-[var(--trust-radius)] border border-[var(--trust-line)] bg-[var(--trust-elevated)]/80">
      <div className="border-b border-[var(--trust-line)] px-4 py-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--trust-accent)] uppercase">
          Plan
        </p>
        <p className="mt-1 font-[family-name:var(--trust-font-display)] text-lg text-[var(--trust-ink)]">
          {plan.goal}
        </p>
        <p className="text-sm text-[var(--trust-ink-muted)]">{plan.time_window}</p>
      </div>
      <ul className="divide-y divide-[var(--trust-line)]">
        {focusBlocks.map((b) => (
          <li key={`${b.start}-${b.title}`} className="grid grid-cols-[4.5rem_1fr] gap-3 px-4 py-3 text-sm">
            <span className="font-medium tabular-nums text-[var(--trust-ink-muted)]">
              {b.start}
            </span>
            <div>
              <p className="font-medium text-[var(--trust-ink)]">{b.title}</p>
              <p className="text-[var(--trust-ink-muted)]">Done when: {b.success_criteria}</p>
            </div>
          </li>
        ))}
      </ul>
      {envelope.mode === "student" || focusBlocks.length > 0 ? (
        <div className="border-t border-[var(--trust-line)] px-4 py-3">
          <button
            type="button"
            onClick={onAddToCalendar}
            className="rounded-[calc(var(--trust-radius)-2px)] border border-[var(--trust-line)] bg-transparent px-3.5 py-2 text-sm font-medium text-[var(--trust-ink)] transition hover:border-[var(--trust-accent)]/50"
          >
            Add to Calendar
          </button>
          <p className="mt-2 text-xs text-[var(--trust-ink-muted)]">
            Via Google after you confirm — credentials stay yours.
          </p>
        </div>
      ) : null}
    </div>
  );
}
