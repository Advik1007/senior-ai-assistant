"use client";

import { Mic, Volume2 } from "lucide-react";

export type VoicePhase = "idle" | "listening" | "speaking" | "processing";

export function VoiceStatus({
  phase,
  listeningLabel,
  speakingLabel,
  idleLabel,
}: {
  phase: VoicePhase;
  listeningLabel: string;
  speakingLabel: string;
  idleLabel: string;
}) {
  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-24 items-center gap-4 rounded-2xl border-4 border-[#0B1F3A] bg-white px-4 py-3 high-contrast:border-white high-contrast:bg-black"
    >
      <div
        className={
          isListening
            ? "flex size-16 items-center justify-center rounded-full bg-[#B00020] text-white"
            : isSpeaking
              ? "flex size-16 items-center justify-center rounded-full bg-[#0B4F8A] text-white"
              : "flex size-16 items-center justify-center rounded-full bg-[#E8EEF4] text-[#0B1F3A]"
        }
      >
        {isSpeaking ? <Volume2 className="size-8" /> : <Mic className="size-8" />}
      </div>
      <p className="text-2xl font-bold">
        {isListening
          ? listeningLabel
          : isSpeaking
            ? speakingLabel
            : phase === "processing"
              ? "…"
              : idleLabel}
      </p>
    </div>
  );
}
