"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { UnkLogo } from "@/components/UnkLogo";

export function AppShell({
  title,
  showBack = true,
  children,
}: {
  title?: string;
  showBack?: boolean;
  children: React.ReactNode;
}) {
  const { strings, prefs } = useApp();

  return (
    <div
      className="app-shell relative mx-auto flex min-h-svh w-full max-w-lg flex-col px-4 pb-8 pt-4"
      data-text-size={prefs.textSize}
      data-a11y={prefs.accessibilityMode ? "on" : "off"}
    >
      <header className="mb-4 flex shrink-0 items-center gap-3 rounded-2xl bg-[#0B1F3A] px-3 py-3 text-white high-contrast:bg-black high-contrast:ring-2 high-contrast:ring-white">
        {showBack ? (
          <Link
            href="/home"
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white high-contrast:border-white"
          >
            <ArrowLeft aria-hidden className="size-6" />
            <span className="sr-only">{strings.back}</span>
          </Link>
        ) : (
          <UnkLogo className="size-12 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-bold tracking-[0.22em] text-[#F4B400] uppercase">
            UNK AI
          </p>
          <h1 className="truncate text-xl font-bold leading-tight sm:text-2xl high-contrast:text-[#FFD60A]">
            {title ?? strings.tagline}
          </h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-3">{children}</main>
    </div>
  );
}
