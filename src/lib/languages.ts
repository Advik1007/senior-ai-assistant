/** Central language configuration for UNK AI. */
export type AppLanguage =
  | "en"
  | "hi"
  | "gu"
  | "mr"
  | "bn"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "pa"
  | "ur"
  | "or"
  | "as"
  | "ne";

export type LanguageOption = {
  code: AppLanguage;
  /** English label for admin/debug only. */
  englishName: string;
  /** Native script label shown in the UI. */
  nativeLabel: string;
  /** BCP-47 speech synthesis / recognition locale. */
  speechLang: string;
  /** HTML document language attribute. */
  htmlLang: string;
  rtl: boolean;
};

export const LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    englishName: "English",
    nativeLabel: "English",
    speechLang: "en-IN",
    htmlLang: "en-IN",
    rtl: false,
  },
  {
    code: "hi",
    englishName: "Hindi",
    nativeLabel: "हिन्दी",
    speechLang: "hi-IN",
    htmlLang: "hi",
    rtl: false,
  },
  {
    code: "gu",
    englishName: "Gujarati",
    nativeLabel: "ગુજરાતી",
    speechLang: "gu-IN",
    htmlLang: "gu",
    rtl: false,
  },
  {
    code: "mr",
    englishName: "Marathi",
    nativeLabel: "मराठी",
    speechLang: "mr-IN",
    htmlLang: "mr",
    rtl: false,
  },
  {
    code: "bn",
    englishName: "Bengali",
    nativeLabel: "বাংলা",
    speechLang: "bn-IN",
    htmlLang: "bn",
    rtl: false,
  },
  {
    code: "ta",
    englishName: "Tamil",
    nativeLabel: "தமிழ்",
    speechLang: "ta-IN",
    htmlLang: "ta",
    rtl: false,
  },
  {
    code: "te",
    englishName: "Telugu",
    nativeLabel: "తెలుగు",
    speechLang: "te-IN",
    htmlLang: "te",
    rtl: false,
  },
  {
    code: "kn",
    englishName: "Kannada",
    nativeLabel: "ಕನ್ನಡ",
    speechLang: "kn-IN",
    htmlLang: "kn",
    rtl: false,
  },
  {
    code: "ml",
    englishName: "Malayalam",
    nativeLabel: "മലയാളം",
    speechLang: "ml-IN",
    htmlLang: "ml",
    rtl: false,
  },
  {
    code: "pa",
    englishName: "Punjabi",
    nativeLabel: "ਪੰਜਾਬੀ",
    speechLang: "pa-IN",
    htmlLang: "pa",
    rtl: false,
  },
  {
    code: "ur",
    englishName: "Urdu",
    nativeLabel: "اردو",
    speechLang: "ur-IN",
    htmlLang: "ur",
    rtl: true,
  },
  {
    code: "or",
    englishName: "Odia",
    nativeLabel: "ଓଡ଼ିଆ",
    speechLang: "or-IN",
    htmlLang: "or",
    rtl: false,
  },
  {
    code: "as",
    englishName: "Assamese",
    nativeLabel: "অসমীয়া",
    speechLang: "as-IN",
    htmlLang: "as",
    rtl: false,
  },
  {
    code: "ne",
    englishName: "Nepali",
    nativeLabel: "नेपाली",
    speechLang: "ne-NP",
    htmlLang: "ne",
    rtl: false,
  },
];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export function languageByCode(code: AppLanguage): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isAppLanguage(value: string): value is AppLanguage {
  return LANGUAGES.some((l) => l.code === value);
}
