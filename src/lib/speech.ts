/**
 * Speech helpers.
 * On Capacitor Android/iOS, uses native Capgo speech recognition
 * (WebView has no reliable webkitSpeechRecognition). In browsers, uses Web Speech API.
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

export type MicPermission = "granted" | "denied" | "unavailable";

export type ListenError =
  | "denied"
  | "unavailable"
  | "no-speech"
  | "busy"
  | "canceled"
  | "failed";

export type ListenOnceResult =
  | { ok: true; transcript: string }
  | { ok: false; error: ListenError; detail?: string };

type NativeSpeech = typeof import("@capgo/capacitor-speech-recognition").SpeechRecognition;

let listenEpoch = 0;

function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // ignore
  }
  const win = window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    androidBridge?: unknown;
  };
  if (win.androidBridge) return true;
  if (win.Capacitor?.isNativePlatform?.()) return true;
  const platform = win.Capacitor?.getPlatform?.();
  return platform === "android" || platform === "ios";
}

async function loadNativeSpeech(): Promise<NativeSpeech | null> {
  if (!isNativeApp()) return null;
  try {
    const mod = await import("@capgo/capacitor-speech-recognition");
    // Probe the native bridge — web stub throws UNIMPLEMENTED.
    await mod.SpeechRecognition.available();
    return mod.SpeechRecognition;
  } catch {
    return null;
  }
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err ?? "");
}

function classifyNativeError(message: string): ListenError {
  const m = message.toLowerCase();
  if (
    m.includes("permission") ||
    m.includes("denied") ||
    m.includes("not-allowed") ||
    m.includes("missing_permission")
  ) {
    return "denied";
  }
  if (
    m.includes("already running") ||
    m.includes("busy") ||
    m.includes("in progress")
  ) {
    return "busy";
  }
  if (
    m.includes("not available") ||
    m.includes("unavailable") ||
    m.includes("service-not-allowed") ||
    m.includes("unimplemented")
  ) {
    return "unavailable";
  }
  // Android Activity.RESULT_CANCELED === 0 when dialog dismissed / failed to open
  if (
    m === "0" ||
    m.includes("cancel") ||
    m.includes("aborted") ||
    m.includes("result_canceled") ||
    m.includes("user")
  ) {
    return "canceled";
  }
  if (m.includes("no.?speech") || m.includes("no match") || m.includes("nomatch")) {
    return "no-speech";
  }
  return "failed";
}

/** Ask for mic access — must run from a user tap on Android/WebView. */
export async function ensureMicPermission(): Promise<MicPermission> {
  if (typeof window === "undefined") return "unavailable";

  const SpeechRecognition = await loadNativeSpeech();
  if (SpeechRecognition) {
    try {
      let status = await SpeechRecognition.checkPermissions();
      if (status.speechRecognition !== "granted") {
        status = await SpeechRecognition.requestPermissions();
      }
      if (status.speechRecognition === "granted") return "granted";
      return "denied";
    } catch {
      return "unavailable";
    }
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return createBrowserSpeechRecognition() ? "granted" : "unavailable";
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return "granted";
  } catch {
    return "denied";
  }
}

async function forceStopNative(SpeechRecognition: NativeSpeech): Promise<void> {
  try {
    await SpeechRecognition.forceStop({ timeout: 400 });
  } catch {
    try {
      await SpeechRecognition.stop();
    } catch {
      // ignore
    }
  }
  await sleep(120);
}

async function startNativeOnce(
  SpeechRecognition: NativeSpeech,
  options: { language: string; prompt: string; popup: boolean },
): Promise<ListenOnceResult> {
  try {
    const { available } = await SpeechRecognition.available();
    if (!available) {
      return { ok: false, error: "unavailable", detail: "SpeechRecognizer unavailable" };
    }

    const result = await SpeechRecognition.start({
      language: options.language,
      maxResults: 3,
      partialResults: false,
      popup: options.popup,
      prompt: options.prompt,
    });

    const transcript = result.matches?.[0]?.trim() ?? "";
    if (!transcript) {
      return { ok: false, error: "no-speech" };
    }
    return { ok: true, transcript };
  } catch (err) {
    return {
      ok: false,
      error: classifyNativeError(errMessage(err)),
      detail: errMessage(err).slice(0, 160),
    };
  }
}

/**
 * One-shot listen from a user tap. Prefer inline Android recognition, then
 * system popup, then browser SpeechRecognition.
 */
export async function listenOnce(options: {
  lang: AppLanguage | string;
  prompt?: string;
}): Promise<ListenOnceResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "unavailable" };
  }

  const epoch = ++listenEpoch;
  const language = speechLocale(options.lang);
  const prompt = options.prompt?.trim() || "Speak now — UNK is listening";

  stopSpeaking();
  // Give TTS / audio focus a beat to release before RECORD_AUDIO.
  await sleep(180);
  if (epoch !== listenEpoch) {
    return { ok: false, error: "canceled" };
  }

  const permission = await ensureMicPermission();
  if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
  if (permission === "denied") return { ok: false, error: "denied" };
  if (permission === "unavailable") {
    // Still try browser path below if native probe failed.
  }

  const SpeechRecognition = await loadNativeSpeech();
  if (SpeechRecognition) {
    await forceStopNative(SpeechRecognition);
    if (epoch !== listenEpoch) return { ok: false, error: "canceled" };

    // Inline first — avoids silent RESULT_CANCELED from the system dialog path.
    let result = await startNativeOnce(SpeechRecognition, {
      language,
      prompt,
      popup: false,
    });
    if (epoch !== listenEpoch) return { ok: false, error: "canceled" };

    if (!result.ok && result.error === "busy") {
      await forceStopNative(SpeechRecognition);
      if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
      result = await startNativeOnce(SpeechRecognition, {
        language,
        prompt,
        popup: false,
      });
      if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
    }

    if (
      !result.ok &&
      result.error !== "denied" &&
      result.error !== "no-speech"
    ) {
      await forceStopNative(SpeechRecognition);
      if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
      const popupResult = await startNativeOnce(SpeechRecognition, {
        language,
        prompt,
        popup: true,
      });
      if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
      if (popupResult.ok) return popupResult;
      if (popupResult.error === "denied") return popupResult;
      if (popupResult.error === "no-speech") return popupResult;
      // Keep the more specific inline error when popup was only canceled.
      if (result.error !== "failed" || popupResult.error !== "canceled") {
        return result.error === "canceled" ? popupResult : result;
      }
    }

    return result;
  }

  // Browser Web Speech API
  const rec = createBrowserSpeechRecognition();
  if (!rec) {
    return { ok: false, error: "unavailable" };
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: ListenOnceResult) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    rec.lang = language;
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      finish(
        transcript
          ? { ok: true, transcript }
          : { ok: false, error: "no-speech" },
      );
    };
    rec.onerror = (event) => {
      const code = event.error || "failed";
      if (code === "not-allowed") finish({ ok: false, error: "denied" });
      else if (code === "no-speech" || code === "aborted") {
        finish({ ok: false, error: code === "aborted" ? "canceled" : "no-speech" });
      } else if (code === "service-not-allowed") {
        finish({ ok: false, error: "unavailable" });
      } else finish({ ok: false, error: "failed", detail: code });
    };
    rec.onend = () => {
      finish({ ok: false, error: "no-speech" });
    };
    try {
      rec.start();
    } catch (err) {
      finish({
        ok: false,
        error: "failed",
        detail: errMessage(err).slice(0, 160),
      });
    }
  });
}

/** Cancel an in-flight listenOnce (native forceStop + invalidate epoch). */
export async function cancelListen(): Promise<void> {
  listenEpoch += 1;
  const SpeechRecognition = await loadNativeSpeech();
  if (SpeechRecognition) {
    await forceStopNative(SpeechRecognition);
  }
  stopSpeaking();
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
        const result = await listenOnce({
          lang: rec.lang,
          prompt: "Speak now — UNK is listening",
        });
        if (thisSession !== session) return;
        if (result.ok) {
          emitResult(rec, result.transcript);
          rec.onend?.();
          return;
        }
        if (result.error === "canceled") {
          rec.onend?.();
          return;
        }
        const map: Record<ListenError, string> = {
          denied: "not-allowed",
          unavailable: "service-not-allowed",
          "no-speech": "no-speech",
          busy: "network",
          canceled: "aborted",
          failed: "network",
        };
        rec.onerror?.({ error: map[result.error] });
        rec.onend?.();
      })();
    },
    stop() {
      session += 1;
      void cancelListen().finally(() => rec.onend?.());
    },
    abort() {
      session += 1;
      void cancelListen().finally(() => rec.onend?.());
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
