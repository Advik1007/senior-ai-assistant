/**
 * Browser speech helpers.
 * Speech-to-text and text-to-speech run on the device.
 * Nothing is recorded or uploaded by these helpers.
 */

import { languageByCode, type AppLanguage } from "@/lib/languages";

export type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

export function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const SpeechWindow = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor =
    SpeechWindow.SpeechRecognition || SpeechWindow.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speechLocale(lang: AppLanguage | string): string {
  if (typeof lang === "string" && lang.length === 2) {
    return languageByCode(lang as AppLanguage).speechLang;
  }
  return languageByCode(lang as AppLanguage).speechLang;
}

export function speakText(
  text: string,
  options: { rate: number; lang: AppLanguage | string; onend?: () => void },
): void {
  if (!canSpeak()) {
    options.onend?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate;
  const locale = speechLocale(options.lang);
  utterance.lang = locale;

  const voices = window.speechSynthesis.getVoices();
  const langCode = locale.slice(0, 2).toLowerCase();
  const matched =
    voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(langCode));
  if (matched) utterance.voice = matched;

  utterance.onend = () => options.onend?.();
  utterance.onerror = () => options.onend?.();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
}
