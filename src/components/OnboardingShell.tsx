"use client";

import type { AppLanguage } from "@/lib/languages";
import { languageByCode } from "@/lib/languages";

/** Large, readable form styles for senior-friendly onboarding screens. */
export const onboardingLabelClass = "text-xl font-semibold text-[#0B1F3A]";
export const onboardingInputClass =
  "h-14 rounded-xl border-2 border-[#0B4F8A]/20 bg-white text-xl md:text-xl focus-visible:border-[#0B4F8A] focus-visible:ring-[#0B4F8A]/25";
export const onboardingMutedTextClass = "text-base leading-snug text-[#5a6f85]";

export function OnboardingShell({
  lang,
  title,
  subtitle,
  tagline,
  children,
  footer,
}: {
  lang: AppLanguage;
  title: string;
  subtitle?: string;
  tagline?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const meta = languageByCode(lang);
  return (
    <div
      className="relative flex min-h-svh flex-col bg-[#0B1F3A]"
      dir={meta.rtl ? "rtl" : "ltr"}
      lang={meta.htmlLang}
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-bold tracking-[0.22em] text-[#F4B400] uppercase">
            UNK AI
          </p>
          {tagline ? (
            <p className="mt-1 text-base text-[#D7E8F7]/90">{tagline}</p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-5 sm:px-6">
        <div className="flex flex-1 flex-col rounded-2xl bg-white p-4 sm:p-6">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#0B1F3A] sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className={`mt-2 ${onboardingMutedTextClass}`}>{subtitle}</p>
          ) : null}
          <div className="mt-4 flex flex-col gap-4 sm:gap-5">{children}</div>
        </div>
        {footer ? (
          <div className="mt-4 text-center text-base leading-snug text-[#D7E8F7]">
            {footer}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export function OnboardingLink({
  href,
  onClick,
  children,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const className =
    "text-base font-semibold text-[#F4B400] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4B400]/40 rounded";

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function OnboardingStatus({
  tone,
  children,
}: {
  tone: "neutral" | "success" | "error" | "loading";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "text-[#5a6f85] bg-[#f7f9fb] border-[#0B1F3A]/10",
    success: "text-[#0D6B3D] bg-[#edf7f0] border-[#0D6B3D]/20",
    error: "text-[#b00020] bg-[#fdf2f4] border-[#b00020]/20",
    loading: "text-[#0B4F8A] bg-[#eef4fa] border-[#0B4F8A]/15",
  };

  return (
    <p
      className={`rounded-xl border-2 px-4 py-3 text-base leading-snug ${tones[tone]}`}
      role="status"
      aria-live="polite"
    >
      {children}
    </p>
  );
}
