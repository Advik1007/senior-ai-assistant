"use client";

import { Mic, Volume2 } from "lucide-react";

export type VoicePhase = "idle" | "listening" | "speaking" | "processing";

export function micButtonTone(
  phase: VoicePhase,
  busy = false,
): "gold" | "help" | "primary" | "muted" {
  if (phase === "listening" || busy) return "help";
  if (phase === "speaking") return "primary";
  if (phase === "processing") return "muted";
  return "gold";
}

export function VoiceStatus({
  phase,
  listeningLabel,
  speakingLabel,
  idleLabel,
  onPress,
}: {
  phase: VoicePhase;
  listeningLabel: string;
  speakingLabel: string;
  idleLabel: string;
  onPress?: () => void;
}) {
  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking";
  const isProcessing = phase === "processing";
  const label = isListening
    ? listeningLabel
    : isSpeaking
      ? speakingLabel
      : isProcessing
        ? "…"
        : idleLabel;

  const box = isListening
    ? "border-[#7A1212] bg-[#C62828] text-white high-contrast:border-white high-contrast:bg-[#FF1744]"
    : isSpeaking
      ? "border-[#083A66] bg-[#0B4F8A] text-white high-contrast:border-white high-contrast:bg-[#0B4F8A]"
      : isProcessing
        ? "border-[#0B4F8A]/20 bg-[#D7E3EF] text-[#0B1F3A] high-contrast:border-white high-contrast:bg-black high-contrast:text-white"
        : "border-[#C49200] bg-[#F4B400] text-[#0B1F3A] high-contrast:border-white high-contrast:bg-[#FFD60A]";

  const disc = isListening
    ? "bg-white text-[#C62828]"
    : isSpeaking
      ? "bg-white text-[#0B4F8A]"
      : isProcessing
        ? "bg-white text-[#0B1F3A]"
        : "bg-[#0B1F3A] text-[#F4B400]";

  const inner = (
    <>
      <div
        className={`flex size-16 items-center justify-center rounded-full ${disc}`}
      >
        {isSpeaking ? (
          <Volume2 className="pointer-events-none size-8" />
        ) : (
          <Mic className="pointer-events-none size-8" />
        )}
      </div>
      <p className="text-2xl font-bold">{label}</p>
    </>
  );

  const shared =
    `flex min-h-24 w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left ${box}`;

  if (onPress) {
    return (
      <button
        type="button"
        aria-live="polite"
        onClick={onPress}
        className={`${shared} cursor-pointer [touch-action:manipulation] active:brightness-95`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div role="status" aria-live="polite" className={shared}>
      {inner}
    </div>
  );
}
