"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useReliableTap } from "@/lib/reliable-tap";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Tone = "primary" | "call" | "help" | "service" | "muted" | "gold";

/** Flat fills — no multi-stop gradients / soft blurs (faster on Android WebView). */
const tones: Record<Tone, string> = {
  primary:
    "bg-[#0B4F8A] text-white border-[#0B4F8A] high-contrast:bg-[#FFD60A] high-contrast:text-black high-contrast:border-white",
  gold:
    "bg-[#F4B400] text-[#0B1F3A] border-[#F4B400] high-contrast:bg-[#FFD60A] high-contrast:text-black high-contrast:border-white",
  call: "bg-[#0D6B3D] text-white border-[#0D6B3D] high-contrast:bg-[#00E676] high-contrast:text-black high-contrast:border-white",
  help: "bg-[#C62828] text-white border-[#C62828] high-contrast:bg-[#FF1744] high-contrast:text-white high-contrast:border-white",
  service:
    "bg-white text-[#0B1F3A] border-[#0B4F8A]/25 high-contrast:bg-black high-contrast:text-white high-contrast:border-white",
  muted:
    "bg-[#D7E3EF] text-[#0B1F3A] border-transparent high-contrast:bg-black high-contrast:text-white high-contrast:border-white",
};

const shared =
  "relative z-10 inline-flex min-h-[4.25rem] cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-xl font-bold leading-tight select-none [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4B400] focus-visible:ring-offset-2 active:brightness-95";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  icon?: ReactNode;
  full?: boolean;
  href?: string;
};

/** Extra-large, high-contrast action control for older adults. */
export function BigButton({
  tone = "primary",
  icon,
  full = true,
  href,
  className,
  children,
  onClick,
  ...props
}: Props) {
  const tap = useReliableTap(onClick, props.disabled);

  const classes = cn(
    shared,
    "disabled:cursor-not-allowed disabled:opacity-50",
    full && "w-full",
    tones[tone],
    className,
  );
  const inner = (
    <>
      {icon ? (
        <span className="pointer-events-none shrink-0 text-2xl" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="pointer-events-none flex-1">{children}</span>
    </>
  );

  if (href) {
    const external =
      href.startsWith("http") ||
      href.startsWith("tel:") ||
      href.startsWith("mailto:");
    if (external) {
      const isHttp = href.startsWith("http");
      return (
        <a
          href={href}
          className={classes}
          {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} prefetch={false} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...props}
      onClick={tap.onClick}
      onTouchEnd={(event) => {
        tap.onTouchEnd(event);
        props.onTouchEnd?.(event);
      }}
    >
      {inner}
    </button>
  );
}
