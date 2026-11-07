"use client";

type Props = {
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorBanner({ title, detail, actionLabel, onAction }: Props) {
  return (
    <div
      role="alert"
      className="mx-auto mb-3 w-full max-w-3xl rounded-[var(--trust-radius)] border border-[var(--trust-danger)]/25 bg-[color-mix(in_srgb,var(--trust-danger)_8%,var(--trust-elevated))] px-4 py-3 text-sm"
    >
      <p className="font-semibold text-[var(--trust-danger)]">{title}</p>
      <p className="mt-1 text-[var(--trust-ink)]">{detail}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 text-sm font-semibold text-[var(--trust-accent)] underline-offset-2 hover:underline"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
