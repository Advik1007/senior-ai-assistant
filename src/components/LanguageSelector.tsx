"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { LANGUAGES, type AppLanguage } from "@/lib/languages";
import { getOnboardingSnapshot, markLanguageChosen } from "@/lib/storage/onboarding";
import { persistOnboardingToNative } from "@/lib/storage/native-onboarding";

/**
 * Instant language pick → same next screen for every language (/auth).
 * Soft navigation so Android WebView does not reload onto a random page.
 */
export function LanguageSelector() {
  const router = useRouter();
  const { prefs, setPrefs, setProfile, profile, strings } = useApp();

  function selectLanguage(code: AppLanguage) {
    setPrefs({ ...prefs, language: code });
    setProfile({ ...profile, preferredLanguage: code });
    markLanguageChosen();
    void persistOnboardingToNative(getOnboardingSnapshot(), code);
    router.replace("/auth");
  }

  return (
    <OnboardingShell
      lang={prefs.language}
      title={strings.languageChoose}
      tagline={strings.tagline}
    >
      <ul
        className="m-0 grid list-none grid-cols-2 gap-2 p-0"
        role="listbox"
        aria-label={strings.languageChoose}
      >
        {LANGUAGES.map((lang) => (
          <li key={lang.code} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={prefs.language === lang.code}
              onClick={() => selectLanguage(lang.code)}
              className="flex min-h-16 w-full cursor-pointer flex-col items-start justify-center rounded-xl border border-[#0B4F8A]/20 bg-[#F7FAFC] px-3 py-2 text-left active:bg-[#E8F1FA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4B400]"
            >
              <span className="text-lg font-bold leading-tight text-[#0B1F3A]">
                {lang.nativeLabel}
              </span>
              <span className="text-sm text-[#5A6B7D]">{lang.englishName}</span>
            </button>
          </li>
        ))}
      </ul>
    </OnboardingShell>
  );
}
