"use client";

import { useCallback, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { BigButton } from "@/components/BigButton";
import { Textarea } from "@/components/ui/textarea";
import { cancelListen, listenOnce, stopSpeaking } from "@/lib/speech";
import type { AppLanguage } from "@/lib/languages";

export function SetupVoiceField({
  lang,
  value,
  onChange,
  onSubmit,
  placeholder,
  listenLabel,
  stopLabel,
  sendLabel,
}: {
  lang: AppLanguage;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  listenLabel: string;
  stopLabel: string;
  sendLabel: string;
}) {
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const genRef = useRef(0);
  const lastTapRef = useRef(0);

  const stopListening = useCallback(() => {
    genRef.current += 1;
    setListening(false);
    void cancelListen();
  }, []);

  const startListening = useCallback(() => {
    const gen = ++genRef.current;
    stopSpeaking();
    setHint(null);
    setListening(true);
    void (async () => {
      const result = await listenOnce({ lang });
      if (gen !== genRef.current) return;
      setListening(false);
      if (result.ok) {
        onChange(result.transcript);
        return;
      }
      if (result.error === "denied") {
        setHint(
          "Microphone permission is blocked. Open phone Settings → Apps → UNK AI → Permissions → Microphone → Allow, then tap again.",
        );
      } else if (result.error === "no-speech") {
        setHint("I did not catch that. Tap the mic and speak again.");
      } else if (result.error === "canceled") {
        setHint("Tap the mic, then speak when the phone is listening.");
      } else {
        setHint("Could not start the microphone. Tap again and allow the mic if asked.");
      }
    })();
  }, [lang, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-28 rounded-2xl border border-[#0B4F8A]/20 p-4 text-xl"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      {hint ? (
        <p
          className="rounded-2xl border border-[#C62828]/30 bg-[#FFF5F5] p-4 text-base font-semibold text-[#C62828]"
          role="status"
        >
          {hint}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <BigButton
          tone={listening ? "help" : "gold"}
          icon={<Mic className="size-7" />}
          onClick={() => {
            const now = Date.now();
            if (now - lastTapRef.current < 1000) return;
            lastTapRef.current = now;
            if (listening) stopListening();
            else startListening();
          }}
        >
          {listening ? stopLabel : listenLabel}
        </BigButton>
        <BigButton tone="call" onClick={onSubmit}>
          {sendLabel}
        </BigButton>
      </div>
    </div>
  );
}
