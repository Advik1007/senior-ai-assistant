"use client";

import { OnboardingShell } from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { LANGUAGES, type AppLanguage } from "@/lib/languages";
import { getOnboardingSnapshot, markLanguageChosen } from "@/lib/storage/onboarding";
import { persistOnboardingToNative } from "@/lib/storage/native-onboarding";

/**
 * Instant language pick → pre-translated static catalog → next screen.
 * Hard navigation so taps always work in Android WebView.
 */
export function LanguageSelector() {
  const { prefs, setPrefs, setProfile, profile, strings } = useApp();

  function selectLanguage(code: AppLanguage) {
    setPrefs({ ...prefs, language: code });
    setProfile({ ...profile, preferredLanguage: code });
    markLanguageChosen();
    void persistOnboardingToNative(getOnboardingSnapshot(), code);
    window.location.assign("/auth");
  }

  return (
    <OnboardingShell
      lang={prefs.language}
      title={strings.languageChoose}
      tagline={strings.tagline}
    >
      <ul
        className="m-0 flex list-none flex-col gap-2 p-0"
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
              className="flex min-h-14 w-full cursor-pointer items-center justify-between rounded-xl border border-[#0B4F8A]/20 bg-[#F7FAFC] px-4 py-3 text-left active:bg-[#E8F1FA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4B400]"
            >
              <span className="text-xl font-bold text-[#0B1F3A]">
                {lang.nativeLabel}
              </span>
              <span className="text-base text-[#5A6B7D]">{lang.englishName}</span>
            </button>
          </li>
        ))}
      </ul>
    </OnboardingShell>
  );
}
