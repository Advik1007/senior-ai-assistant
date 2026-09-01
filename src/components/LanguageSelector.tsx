"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { LANGUAGES, type AppLanguage } from "@/lib/languages";
import {
  getOnboardingSnapshot,
  markLanguageChosen,
  setupPathForStep,
} from "@/lib/storage/onboarding";

export function LanguageSelector() {
  const router = useRouter();
  const { prefs, setPrefs, setProfile, profile, strings, authStatus } = useApp();

  function selectLanguage(code: AppLanguage) {
    setPrefs({ ...prefs, language: code });
    setProfile({ ...profile, preferredLanguage: code });
    markLanguageChosen();

    // Language → login (unless server session already valid) → setup → home
    if (authStatus !== "authenticated") {
      router.push("/auth/login");
      return;
    }

    const state = getOnboardingSnapshot();
    if (!state.setupWizardComplete) {
      router.push(setupPathForStep(state.setupStep || "contacts"));
      return;
    }

    router.push("/home");
  }

  return (
    <OnboardingShell lang={prefs.language} title={strings.languageChoose} tagline={strings.tagline}>
      <ul className="m-0 list-none p-0" role="listbox" aria-label={strings.languageChoose}>
        {LANGUAGES.map((lang) => (
          <li key={lang.code} role="presentation">
            <div
              role="option"
              tabIndex={0}
              aria-selected={prefs.language === lang.code}
              onClick={() => selectLanguage(lang.code)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectLanguage(lang.code);
                }
              }}
              className="flex min-h-[4.5rem] cursor-pointer items-center justify-between border-b border-[#0B1F3A]/10 px-2 py-4 last:border-b-0 hover:bg-[#f7f9fb] hover:text-[#0B4F8A] focus-visible:bg-[#eef4fa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0B4F8A]/25"
            >
              <span className="text-2xl font-semibold text-[#0B1F3A] sm:text-3xl">
                {lang.nativeLabel}
              </span>
              <span className="text-lg text-[#8a9bb0] sm:text-xl">{lang.englishName}</span>
            </div>
          </li>
        ))}
      </ul>
    </OnboardingShell>
  );
}
