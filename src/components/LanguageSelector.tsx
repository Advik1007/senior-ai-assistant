"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { LANGUAGES, type AppLanguage } from "@/lib/languages";
import { getOnboardingSnapshot, markLanguageChosen } from "@/lib/storage/onboarding";
import { persistOnboardingToNative } from "@/lib/storage/native-onboarding";

/**
 * Language pick → save preference → next screen.
 * UI text comes from the static catalog for that language (en / hi / gu / …).
 * Paste full translations into the matching i18n files — no Gemini gate.
 */
export function LanguageSelector() {
  const router = useRouter();
  const { prefs, setPrefs, setProfile, profile, strings } = useApp();

  async function selectLanguage(code: AppLanguage) {
    setPrefs({ ...prefs, language: code });
    setProfile({ ...profile, preferredLanguage: code });
    markLanguageChosen();
    await persistOnboardingToNative(getOnboardingSnapshot(), code);
    router.replace("/auth");
  }

  return (
    <OnboardingShell
      lang={prefs.language}
      title={strings.languageChoose}
      tagline={strings.tagline}
    >
      <ul
        className="m-0 grid list-none grid-cols-1 content-start gap-0 p-0 sm:grid-cols-2"
        role="listbox"
        aria-label={strings.languageChoose}
      >
        {LANGUAGES.map((lang) => (
          <li key={lang.code} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={prefs.language === lang.code}
              onClick={() => void selectLanguage(lang.code)}
              className="flex min-h-12 w-full cursor-pointer items-center justify-between border-b border-[#0B1F3A]/10 px-2 py-3 text-left hover:bg-[#f7f9fb] hover:text-[#0B4F8A] focus-visible:bg-[#eef4fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F8A]/25"
            >
              <span className="text-lg font-semibold text-[#0B1F3A] sm:text-xl">
                {lang.nativeLabel}
              </span>
              <span className="text-sm text-[#8a9bb0] sm:text-base">
                {lang.englishName}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </OnboardingShell>
  );
}
