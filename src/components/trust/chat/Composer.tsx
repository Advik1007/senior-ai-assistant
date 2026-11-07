"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
};

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  streaming,
  placeholder = "Subjects, deadlines, hours available…",
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const labelId = useId();

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (streaming) onStop();
      else ref.current?.blur();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!streaming && value.trim() && !disabled) onSend();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (streaming) {
      onStop();
      return;
    }
    if (value.trim() && !disabled) onSend();
  }

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      className="trust-composer sticky bottom-0 z-20 border-t border-[var(--trust-line)] bg-[color-mix(in_srgb,var(--trust-elevated)_92%,transparent)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-4"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="sr-only">
        Message composer
      </p>
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-[var(--trust-radius)] border border-[var(--trust-line)] bg-[var(--trust-elevated)] p-2 shadow-[0_10px_30px_-18px_rgba(20,32,51,0.45)]">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 8000))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled && !streaming}
          className="max-h-[180px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[0.98rem] leading-relaxed text-[var(--trust-ink)] outline-none placeholder:text-[var(--trust-ink-muted)] disabled:opacity-60"
          aria-label="Organize message"
        />
        <button
          type="submit"
          disabled={streaming ? false : !canSend}
          className="mb-0.5 inline-flex h-10 shrink-0 items-center justify-center rounded-[calc(var(--trust-radius)-2px)] bg-[var(--trust-accent)] px-4 text-sm font-semibold text-[var(--trust-accent-ink)] transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--trust-accent-soft)]"
        >
          {streaming ? "Stop" : "Send"}
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl px-1 text-[0.7rem] text-[var(--trust-ink-muted)]">
        Enter to send · Shift+Enter for newline · Esc to stop
      </p>
    </form>
  );
}
