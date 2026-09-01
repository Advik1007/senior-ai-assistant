"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "primary" | "call" | "help" | "service" | "muted";

const tones: Record<Tone, string> = {
  primary:
    "bg-[#0B4F8A] text-white hover:bg-[#083A66] border-[#083A66] high-contrast:bg-[#FFD60A] high-contrast:text-black high-contrast:border-white",
  call: "bg-[#0D6B3D] text-white hover:bg-[#094C2B] border-[#094C2B] high-contrast:bg-[#00E676] high-contrast:text-black",
  help: "bg-[#B00020] text-white hover:bg-[#8A0018] border-[#8A0018] high-contrast:bg-[#FF1744] high-contrast:text-white",
  service:
    "bg-white text-[#0B1F3A] hover:bg-[#EEF3F8] border-[#0B1F3A] high-contrast:bg-black high-contrast:text-white high-contrast:border-white",
  muted:
    "bg-[#E8EEF4] text-[#0B1F3A] hover:bg-[#D5DEE8] border-[#0B1F3A]/20 high-contrast:bg-black high-contrast:text-white high-contrast:border-white",
};

const shared =
  "inline-flex min-h-20 items-center justify-center gap-3 rounded-2xl border-4 px-5 py-4 text-left text-2xl font-bold leading-tight shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4B400] focus-visible:ring-offset-4";

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
  ...props
}: Props) {
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
        <span className="shrink-0 text-3xl" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="flex-1">{children}</span>
    </>
  );

  if (href) {
    const external =
      href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");
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
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {inner}
    </button>
  );
}
