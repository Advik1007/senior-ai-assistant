"use client";

import { Mic } from "lucide-react";
import { beginSpeakNowFromTap, speechLocale } from "@/lib/speech";

/**
 * In-page gold control. Opens Android's Speak now popup from this tap.
 */
export function MicListenLink({
  label,
  language,
  onPress,
}: {
  label: string;
  language: string;
  onPress: () => void;
}) {
  return (
    <a
      id="unk-mic-link"
      href="#unk-listen"
      className="relative z-30 flex min-h-28 w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-[#C49200] bg-[#F4B400] px-4 py-4 text-left no-underline text-[#0B1F3A]"
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "rgba(244,180,0,0.45)" }}
      onClick={(event) => {
        event.preventDefault();
        beginSpeakNowFromTap(speechLocale(language));
        onPress();
      }}
    >
      <span
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-[#F4B400]"
        aria-hidden
      >
        <Mic className="size-8" />
      </span>
      <span className="text-2xl font-bold">{label}</span>
    </a>
  );
}
