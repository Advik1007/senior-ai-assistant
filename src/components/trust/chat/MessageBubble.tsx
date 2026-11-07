"use client";

import type { ChatMessage } from "@/lib/trust/types";
import { PlanSurface } from "@/components/trust/chat/PlanSurface";

type Props = {
  message: ChatMessage;
  onRetry?: () => void;
  onAddToCalendar?: () => void;
  onConfirmGoogle?: () => void;
  onCancelGoogle?: () => void;
};

export function MessageBubble({
  message,
  onRetry,
  onAddToCalendar,
  onConfirmGoogle,
  onCancelGoogle,
}: Props) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const streaming = message.status === "streaming";

  return (
    <article
      className={[
        "trust-msg w-full max-w-3xl",
        isUser ? "ml-auto" : "mr-auto",
        streaming ? "trust-stream-in" : "",
      ].join(" ")}
      data-role={message.role}
    >
      <div
        className={[
          "px-1 py-2 sm:px-2",
          isUser
            ? "rounded-[var(--trust-radius)] bg-[var(--trust-user-wash)] px-3.5 py-3 sm:px-4"
            : "",
        ].join(" ")}
      >
        {!isUser ? (
          <p className="mb-1.5 text-[0.65rem] font-semibold tracking-[0.14em] text-[var(--trust-ink-muted)] uppercase">
            Trust AI
          </p>
        ) : null}
        <div
          className={[
            "whitespace-pre-wrap text-[0.98rem] leading-[1.62] text-[var(--trust-ink)]",
            isError ? "text-[var(--trust-danger)]" : "",
          ].join(" ")}
        >
          {message.content}
          {streaming ? <span className="trust-caret" aria-hidden /> : null}
        </div>
        {isError && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-[calc(var(--trust-radius)-2px)] border border-[var(--trust-danger)]/30 px-3 py-1.5 text-sm font-medium text-[var(--trust-danger)]"
          >
            Retry
          </button>
        ) : null}
        {!isUser && message.envelope ? (
          <PlanSurface
            envelope={message.envelope}
            onAddToCalendar={onAddToCalendar}
            onConfirmGoogle={onConfirmGoogle}
            onCancelGoogle={onCancelGoogle}
          />
        ) : null}
      </div>
    </article>
  );
}
