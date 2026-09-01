"use client";

import type { AppLanguage } from "@/lib/languages";
import { languageByCode } from "@/lib/languages";

/** Large, readable form styles for senior-friendly onboarding screens. */
export const onboardingLabelClass = "text-xl font-semibold text-[#0B1F3A]";
export const onboardingInputClass =
  "h-16 rounded-xl border-2 border-[#0B1F3A]/15 bg-white text-xl md:text-xl";
export const onboardingMutedTextClass = "text-lg leading-relaxed text-[#5a6f85]";

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
      className="flex min-h-dvh flex-col bg-[#F4F1E8]"
      dir={meta.rtl ? "rtl" : "ltr"}
      lang={meta.htmlLang}
    >
      <header className="border-b border-[#0B1F3A]/10 bg-white/80 px-6 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-[#0B4F8A] uppercase">
              UNK AI
            </p>
            {tagline ? (
              <p className="mt-1 text-lg text-[#5a6f85]">{tagline}</p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-[#0B1F3A]/12 bg-white p-6 shadow-[0_1px_3px_rgba(11,31,58,0.06)] sm:p-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0B1F3A] sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className={`mt-4 ${onboardingMutedTextClass}`}>{subtitle}</p>
          ) : null}
          <div className="mt-8 flex flex-col gap-6 sm:gap-7">{children}</div>
        </div>
        {footer ? (
          <div className="mt-8 text-center text-lg leading-relaxed">{footer}</div>
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
    "text-lg font-medium text-[#0B4F8A] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0B4F8A]/30 rounded";

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
      className={`rounded-xl border-2 px-5 py-4 text-lg leading-relaxed ${tones[tone]}`}
      role="status"
      aria-live="polite"
    >
      {tone === "loading" ? (
        <span className="mr-2 inline-block h-3 w-3 animate-pulse rounded-full bg-[#0B4F8A]" />
      ) : null}
      {children}
    </p>
  );
}
