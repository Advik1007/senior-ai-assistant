/**
 * Speech helpers.
 * On Capacitor Android/iOS, uses native speech recognition
 * (WebView has no webkitSpeechRecognition). In browsers, uses Web Speech API.
 */

import { Capacitor } from "@capacitor/core";
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

function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // ignore
  }
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

function createBrowserSpeechRecognition(): SpeechRecognitionLike | null {
  const SpeechWindow = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor =
    SpeechWindow.SpeechRecognition || SpeechWindow.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

function emitResult(
  rec: SpeechRecognitionLike,
  transcript: string,
): void {
  const text = transcript.trim();
  if (!text) return;
  rec.onresult?.({
    results: [[{ transcript: text }]],
  });
}

function createNativeSpeechRecognition(): SpeechRecognitionLike {
  let session = 0;

  const rec: SpeechRecognitionLike = {
    lang: "en-US",
    interimResults: false,
    continuous: false,
    maxAlternatives: 1,
    onresult: null,
    onerror: null,
    onend: null,
    start() {
      const thisSession = ++session;
      void (async () => {
        try {
          const { SpeechRecognition } = await import(
            "@capgo/capacitor-speech-recognition"
          );

          const permission = await SpeechRecognition.requestPermissions();
          if (permission.speechRecognition !== "granted") {
            if (thisSession !== session) return;
            rec.onerror?.({ error: "not-allowed" });
            rec.onend?.();
            return;
          }

          const { available } = await SpeechRecognition.available();
          if (!available) {
            if (thisSession !== session) return;
            rec.onerror?.({ error: "service-not-allowed" });
            rec.onend?.();
            return;
          }

          const onAndroid = Capacitor.getPlatform() === "android";

          // Samsung / Android WebView: system speech dialog is the reliable path.
          // Inline recognition often fails silently without Google's dialog UI.
          const result = await SpeechRecognition.start({
            language: rec.lang || "en-US",
            maxResults: Math.max(1, rec.maxAlternatives || 1),
            partialResults: false,
            popup: onAndroid,
            prompt: "Speak now",
          });

          if (thisSession !== session) return;

          const transcript = result.matches?.[0]?.trim() ?? "";
          if (transcript) {
            emitResult(rec, transcript);
          } else {
            // Empty result — user cancelled or silence. Stay quiet, end session.
            rec.onerror?.({ error: "no-speech" });
          }
          rec.onend?.();
        } catch (err) {
          if (thisSession !== session) return;
          const message =
            err instanceof Error ? err.message.toLowerCase() : String(err);
          // User dismissed the system dialog — not a hard failure.
          if (
            message.includes("cancel") ||
            message.includes("aborted") ||
            message.includes("user")
          ) {
            rec.onend?.();
            return;
          }
          rec.onerror?.({ error: "network" });
          rec.onend?.();
        }
      })();
    },
    stop() {
      session += 1;
      void import("@capgo/capacitor-speech-recognition")
        .then(({ SpeechRecognition }) => SpeechRecognition.stop())
        .catch(() => undefined)
        .finally(() => rec.onend?.());
    },
    abort() {
      session += 1;
      void import("@capgo/capacitor-speech-recognition")
        .then(({ SpeechRecognition }) => SpeechRecognition.forceStop())
        .catch(() => undefined)
        .finally(() => rec.onend?.());
    },
  };

  return rec;
}

export function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;

  if (isNativeApp()) {
    return createNativeSpeechRecognition();
  }

  return createBrowserSpeechRecognition();
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
