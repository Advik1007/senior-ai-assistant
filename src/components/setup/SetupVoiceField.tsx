"use client";

import { useCallback, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { BigButton } from "@/components/BigButton";
import { Textarea } from "@/components/ui/textarea";
import {
  getSpeechRecognition,
  speechLocale,
  stopSpeaking,
  type SpeechRecognitionLike,
} from "@/lib/speech";
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    stopSpeaking();
    const rec = getSpeechRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    rec.lang = speechLocale(lang);
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      onChange(transcript.trim());
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [lang, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-28 rounded-2xl border-2 border-[#0B1F3A]/15 p-4 text-xl"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <BigButton
          tone={listening ? "help" : "primary"}
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
