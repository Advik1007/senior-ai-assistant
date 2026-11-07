import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "hero" | "rail";
};

export function Wordmark({ className, size = "rail" }: Props) {
  const hero = size === "hero";
  return (
    <div className={cn("trust-wordmark select-none", className)} aria-label="Trust AI">
      <p
        className={cn(
          "font-[family-name:var(--trust-font-display)] font-semibold tracking-[-0.03em] text-[var(--trust-ink)]",
          hero
            ? "text-[clamp(2.75rem,10vw,4.75rem)] leading-none"
            : "text-[1.35rem] leading-none sm:text-[1.5rem]",
        )}
      >
        Trust AI
      </p>
      {!hero ? (
        <p className="mt-0.5 text-[0.7rem] font-medium tracking-[0.18em] text-[var(--trust-ink-muted)] uppercase">
          Work organizer
        </p>
      ) : null}
    </div>
  );
}
