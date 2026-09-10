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
  const genRef = useRef(0);

  const stopListening = useCallback(() => {
    genRef.current += 1;
    setListening(false);
    void cancelListen();
  }, []);

  const startListening = useCallback(() => {
    const gen = ++genRef.current;
    stopSpeaking();
    setListening(true);
    void (async () => {
      const result = await listenOnce({ lang });
      if (gen !== genRef.current) return;
      setListening(false);
      if (result.ok) {
        onChange(result.transcript);
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <BigButton
          tone={listening ? "help" : "gold"}
          icon={<Mic className="size-7" />}
          onClick={() => (listening ? stopListening() : startListening())}
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
