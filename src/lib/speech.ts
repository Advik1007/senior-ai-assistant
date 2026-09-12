/**
 * Speech helpers.
 * Prefer the website microphone (Web Speech + getUserMedia) from a user tap.
 * Native Capgo is a fallback inside the Android app. Server transcription is last.
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

export type MicPermission = "granted" | "prompted" | "denied" | "unavailable";

export type ListenError =
  | "denied"
  | "unavailable"
  | "no-speech"
  | "busy"
  | "canceled"
  | "needs-tap"
  | "failed";

export type ListenOnceResult =
  | { ok: true; transcript: string }
  | { ok: false; error: ListenError; detail?: string };

type NativeSpeech = typeof import("@capgo/capacitor-speech-recognition").SpeechRecognition;

let listenEpoch = 0;
let nativeSpeechCache: NativeSpeech | null | undefined;
let websiteAbort: (() => void) | null = null;

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
  if (nativeSpeechCache !== undefined) return nativeSpeechCache;
  try {
    const mod = await import("@capgo/capacitor-speech-recognition");
    nativeSpeechCache = mod.SpeechRecognition;
    return nativeSpeechCache;
  } catch {
    nativeSpeechCache = null;
    return null;
  }
}

function hasWebsiteSpeechApi(): boolean {
  if (typeof window === "undefined") return false;
  const SpeechWindow = window as Window & {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(
    SpeechWindow.SpeechRecognition || SpeechWindow.webkitSpeechRecognition,
  );
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
    m.includes("missing_permission") ||
    m.includes("insufficient")
  ) {
    return "denied";
  }
  if (
    m.includes("already running") ||
    m.includes("busy") ||
    m.includes("in progress") ||
    m.includes("recognizer_busy") ||
    m.includes("recognition service busy")
  ) {
    return "busy";
  }
  if (
    m.includes("not available") ||
    m.includes("unavailable") ||
    m.includes("service-not-allowed") ||
    m.includes("unimplemented") ||
    m.includes("not_available")
  ) {
    return "unavailable";
  }
  if (
    m.includes("no.?speech") ||
    m.includes("no match") ||
    m.includes("nomatch") ||
    m.includes("speech_timeout") ||
    m.includes("speech timeout")
  ) {
    return "no-speech";
  }
  // Android popup dismiss is Activity.RESULT_CANCELED === 0.
  // Double-tap / Studio delayed-click also force-stops the session.
  if (
    m === "0" ||
    m.includes("result_canceled") ||
    m.includes("canceled") ||
    m.includes("cancelled") ||
    m.includes("aborted") ||
    m.includes("stopped before final")
  ) {
    return "canceled";
  }
  return "failed";
}

function stopTracks(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      // ignore
    }
  });
}

function recorderMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

type UnkMicBridge = {
  hasMicPermission?: () => boolean;
  requestMicPermission?: () => void;
};

function nativeMicBridge(): UnkMicBridge | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as Window & { UnkMic?: UnkMicBridge }).UnkMic;
  return bridge ?? null;
}

/** Android runtime RECORD_AUDIO dialog from MainActivity (not the website). */
function requestNativeRecordAudio(): Promise<MicPermission> {
  const bridge = nativeMicBridge();
  if (!bridge?.requestMicPermission) return Promise.resolve("unavailable");

  try {
    if (bridge.hasMicPermission?.()) return Promise.resolve("granted");
  } catch {
    // Fall through and show the system prompt.
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: MicPermission) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("unk-mic-permission", onEvent);
      window.clearTimeout(timer);
      resolve(value);
    };
    const onEvent = (event: Event) => {
      const granted = Boolean(
        (event as CustomEvent<{ granted?: boolean }>).detail?.granted,
      );
      finish(granted ? "prompted" : "denied");
    };
    const timer = window.setTimeout(() => {
      try {
        finish(bridge.hasMicPermission?.() ? "prompted" : "denied");
      } catch {
        finish("denied");
      }
    }, 25000);
    window.addEventListener("unk-mic-permission", onEvent);
    try {
      bridge.requestMicPermission?.();
    } catch {
      finish("unavailable");
    }
  });
}

/** Ask for mic access from a user tap. Native app uses Capgo; browsers use getUserMedia. */
export async function ensureMicPermission(): Promise<MicPermission> {
  if (typeof window === "undefined") return "unavailable";

  if (isNativeApp()) {
    const native = await requestNativeRecordAudio();
    if (native === "denied") return "denied";

    const SpeechRecognition = await loadNativeSpeech();
    if (!SpeechRecognition) {
      return native === "granted" || native === "prompted" ? native : "unavailable";
    }
    try {
      let status = await SpeechRecognition.checkPermissions();
      if (status.speechRecognition !== "granted") {
        status = await SpeechRecognition.requestPermissions();
      }
      if (status.speechRecognition !== "granted") {
        return native === "granted" || native === "prompted" ? native : "denied";
      }
      return native === "prompted" ? "prompted" : "granted";
    } catch {
      return native === "granted" || native === "prompted" ? native : "unavailable";
    }
  }

  if (navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stopTracks(stream);
      return "granted";
    } catch {
      return "denied";
    }
  }

  return createBrowserSpeechRecognition() ? "granted" : "unavailable";
}

/** Show the Android Allow-microphone dialog as soon as Talk/Help opens. */
export async function warmUpNativeMicPermission(): Promise<void> {
  if (!isNativeApp()) return;
  await ensureMicPermission();
}

async function openWebsiteMic(): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null;
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    return null;
  }
}

function listenWithWebsiteSpeech(
  language: string,
  stream: MediaStream | null,
): Promise<ListenOnceResult> {
  const rec = createBrowserSpeechRecognition();
  if (!rec) {
    stopTracks(stream);
    return Promise.resolve({ ok: false, error: "unavailable" });
  }

  return new Promise((resolve) => {
    let settled = false;
    let last = "";
    const finish = (value: ListenOnceResult) => {
      if (settled) return;
      settled = true;
      websiteAbort = null;
      try {
        rec.stop();
      } catch {
        // ignore
      }
      try {
        rec.abort();
      } catch {
        // ignore
      }
      stopTracks(stream);
      resolve(value);
    };

    websiteAbort = () => finish({ ok: false, error: "canceled" });

    rec.lang = language;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i]?.[0]?.transcript ?? "";
      }
      last = text.trim();
      const lastResult = event.results[event.results.length - 1] as
        | (ArrayLike<{ transcript: string }> & { isFinal?: boolean })
        | undefined;
      if (last && lastResult?.isFinal) {
        finish({ ok: true, transcript: last });
      }
    };
    rec.onerror = (event) => {
      const code = event.error || "failed";
      if (code === "not-allowed") finish({ ok: false, error: "denied" });
      else if (code === "no-speech") finish({ ok: false, error: "no-speech" });
      else if (code === "aborted") finish({ ok: false, error: "canceled" });
      else if (code === "service-not-allowed") {
        finish({ ok: false, error: "unavailable" });
      } else finish({ ok: false, error: "failed", detail: code });
    };
    rec.onend = () => {
      if (last) finish({ ok: true, transcript: last });
      else finish({ ok: false, error: "no-speech" });
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

    window.setTimeout(() => {
      if (last) finish({ ok: true, transcript: last });
      else finish({ ok: false, error: "no-speech" });
    }, 8000);
  });
}

async function listenWithWebsiteRecorder(
  language: string,
  epoch: number,
): Promise<ListenOnceResult> {
  if (typeof MediaRecorder === "undefined") {
    return { ok: false, error: "unavailable" };
  }

  const stream = await openWebsiteMic();
  if (!stream) return { ok: false, error: "denied" };
  if (epoch !== listenEpoch) {
    stopTracks(stream);
    return { ok: false, error: "canceled" };
  }

  const mime = recorderMimeType();
  const chunks: BlobPart[] = [];

  return new Promise((resolve) => {
    let settled = false;
    let recorder: MediaRecorder;
    try {
      recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
    } catch {
      stopTracks(stream);
      resolve({ ok: false, error: "unavailable" });
      return;
    }

    const finish = (value: ListenOnceResult) => {
      if (settled) return;
      settled = true;
      websiteAbort = null;
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // ignore
      }
      stopTracks(stream);
      resolve(value);
    };

    websiteAbort = () => finish({ ok: false, error: "canceled" });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => finish({ ok: false, error: "failed" });
    recorder.onstop = () => {
      if (settled) return;
      void (async () => {
        const blob = new Blob(chunks, {
          type: recorder.mimeType || mime || "audio/webm",
        });
        stopTracks(stream);
        if (epoch !== listenEpoch) {
          finish({ ok: false, error: "canceled" });
          return;
        }
        if (blob.size < 200) {
          finish({ ok: false, error: "no-speech" });
          return;
        }
        try {
          const form = new FormData();
          form.append("audio", blob, "speech.webm");
          form.append("lang", language);
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
          });
          if (epoch !== listenEpoch) {
            finish({ ok: false, error: "canceled" });
            return;
          }
          if (!res.ok) {
            finish({
              ok: false,
              error: res.status === 503 ? "unavailable" : "failed",
            });
            return;
          }
          const data = (await res.json()) as { transcript?: string };
          const transcript = data.transcript?.trim() ?? "";
          finish(
            transcript
              ? { ok: true, transcript }
              : { ok: false, error: "no-speech" },
          );
        } catch {
          finish({ ok: false, error: "failed" });
        }
      })();
    };

    try {
      recorder.start();
    } catch {
      finish({ ok: false, error: "failed" });
      return;
    }

    window.setTimeout(() => {
      try {
        if (recorder.state === "recording") recorder.stop();
      } catch {
        finish({ ok: false, error: "failed" });
      }
    }, 7000);
  });
}

async function forceStopNative(SpeechRecognition: NativeSpeech): Promise<void> {
  try {
    await SpeechRecognition.forceStop({ timeout: 250 });
  } catch {
    try {
      await SpeechRecognition.stop();
    } catch {
      // ignore
    }
  }
}

async function stopNativeIfListening(
  SpeechRecognition: NativeSpeech,
): Promise<void> {
  try {
    const { listening } = await SpeechRecognition.isListening();
    if (!listening) return;
  } catch {
    return;
  }
  await forceStopNative(SpeechRecognition);
  await sleep(180);
}

async function startNativeOnce(
  SpeechRecognition: NativeSpeech,
  options: { language: string; prompt: string; popup: boolean },
): Promise<ListenOnceResult> {
  try {
    const result = await SpeechRecognition.start({
      language: options.language,
      maxResults: 3,
      partialResults: false,
      popup: options.popup,
      prompt: options.prompt,
      allowForSilence: 2500,
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
 * One-shot listen from a user tap.
 * Android app: native speech (WebView SpeechRecognition is a dummy and blocks the mic).
 * Browser website: Web Speech API, then server transcription.
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

  const native = isNativeApp();

  if (native) {
    const permission = await ensureMicPermission();
    if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
    if (permission === "denied") return { ok: false, error: "denied" };
    if (permission === "prompted") return { ok: false, error: "needs-tap" };

    const SpeechRecognition = await loadNativeSpeech();
    if (SpeechRecognition) {
      try {
        const { available } = await SpeechRecognition.available();
        if (available) {
          await stopNativeIfListening(SpeechRecognition);
          if (epoch !== listenEpoch) return { ok: false, error: "canceled" };

          // Android's reliable STT is the system "Speak now" dialog.
          let result = await startNativeOnce(SpeechRecognition, {
            language,
            prompt,
            popup: true,
          });
          if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
          if (result.ok || result.error === "denied") return result;

          await forceStopNative(SpeechRecognition);
          await sleep(400);
          if (epoch !== listenEpoch) return { ok: false, error: "canceled" };

          result = await startNativeOnce(SpeechRecognition, {
            language,
            prompt,
            popup: false,
          });
          if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
          if (result.ok || result.error === "denied") return result;

          await forceStopNative(SpeechRecognition);
          await sleep(250);
        }
      } catch {
        // Native plugin missing — use recorder below.
      }
    }
  } else if (hasWebsiteSpeechApi()) {
    const stream = await openWebsiteMic();
    if (epoch !== listenEpoch) {
      stopTracks(stream);
      return { ok: false, error: "canceled" };
    }
    const web = await listenWithWebsiteSpeech(language, stream);
    if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
    if (web.ok || web.error === "no-speech" || web.error === "denied") {
      return web;
    }
  }

  const recorded = await listenWithWebsiteRecorder(language, epoch);
  if (epoch !== listenEpoch) return { ok: false, error: "canceled" };
  return recorded;
}

/** Cancel an in-flight listenOnce (native forceStop + invalidate epoch). */
export async function cancelListen(): Promise<void> {
  listenEpoch += 1;
  websiteAbort?.();
  websiteAbort = null;
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
          "needs-tap": "aborted",
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
  stopSpeaking();
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
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.pause();
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
