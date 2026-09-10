"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, OnboardingStatus } from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { ensureLanguageCatalog } from "@/lib/i18n/client-catalog";
import { LANGUAGES, type AppLanguage } from "@/lib/languages";
import { getOnboardingSnapshot, markLanguageChosen } from "@/lib/storage/onboarding";
import { persistOnboardingToNative } from "@/lib/storage/native-onboarding";

export function LanguageSelector() {
  const router = useRouter();
  const { prefs, setPrefs, setProfile, profile, strings } = useApp();
  const [busyCode, setBusyCode] = useState<AppLanguage | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectLanguage(code: AppLanguage) {
    if (busyCode) return;
    setBusyCode(code);
    setError(null);

    try {
      // Wait for Gemini (or English master) so EVERY page uses translated strings.
      const catalog = await ensureLanguageCatalog(code);
      if (!catalog && code !== "en") {
        setError(
          "Could not translate right now. Check your connection and try again.",
        );
        setBusyCode(null);
        return;
      }

      setPrefs({ ...prefs, language: code });
      setProfile({ ...profile, preferredLanguage: code });
      markLanguageChosen();
      await persistOnboardingToNative(getOnboardingSnapshot(), code);
      router.replace("/auth");
    } catch {
      setError(
        "Could not translate right now. Check your connection and try again.",
      );
      setBusyCode(null);
    }
  }

  const busyLabel = busyCode
    ? LANGUAGES.find((l) => l.code === busyCode)?.nativeLabel
    : null;

  return (
    <OnboardingShell
      lang={prefs.language}
      title={strings.languageChoose}
      tagline={strings.tagline}
    >
      {busyCode ? (
        <OnboardingStatus tone="loading">
          {`Translating every screen into ${busyLabel} with UNK…`}
        </OnboardingStatus>
      ) : null}
      {error ? <OnboardingStatus tone="error">{error}</OnboardingStatus> : null}

      <ul
        className="m-0 grid list-none grid-cols-1 content-start gap-0 p-0 sm:grid-cols-2"
        role="listbox"
        aria-label={strings.languageChoose}
        aria-busy={Boolean(busyCode)}
      >
        {LANGUAGES.map((lang) => (
          <li key={lang.code} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={prefs.language === lang.code}
              disabled={Boolean(busyCode)}
              onClick={() => void selectLanguage(lang.code)}
              className="flex min-h-12 w-full cursor-pointer items-center justify-between border-b border-[#0B1F3A]/10 px-2 py-3 text-left hover:bg-[#f7f9fb] hover:text-[#0B4F8A] focus-visible:bg-[#eef4fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F8A]/25 disabled:cursor-wait disabled:opacity-60"
            >
              <span className="text-lg font-semibold text-[#0B1F3A] sm:text-xl">
                {lang.nativeLabel}
              </span>
              <span className="text-sm text-[#8a9bb0] sm:text-base">
                {busyCode === lang.code ? "…" : lang.englishName}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </OnboardingShell>
  );
}
