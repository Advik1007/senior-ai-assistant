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
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-4"
      data-text-size={prefs.textSize}
      data-a11y={prefs.accessibilityMode ? "on" : "off"}
    >
      <header className="mb-4 flex items-center gap-3">
        {showBack ? (
          <Link
            href="/"
            className="inline-flex min-h-14 min-w-14 items-center justify-center rounded-2xl border-4 border-[#0B1F3A] bg-white px-3 text-xl font-bold text-[#0B1F3A] high-contrast:border-white high-contrast:bg-black high-contrast:text-white"
          >
            <ArrowLeft aria-hidden className="size-8" />
            <span className="sr-only">{strings.back}</span>
          </Link>
        ) : (
          <UnkLogo />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0B4F8A] high-contrast:text-[#FFD60A]">
            {strings.appName}
          </p>
          <h1 className="truncate text-3xl font-extrabold leading-tight">
            {title ?? strings.tagline}
          </h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4">{children}</main>
    </div>
  );
}
