"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { interpretUserSpeech } from "@/lib/ai/local-assistant";
import type { ToolCall } from "@/lib/ai/tools";
import type { Contact } from "@/lib/db/schema";
import { hasUsablePhoneNumber, startPhoneCall } from "@/lib/phone";
import {
  getSpeechRecognition,
  speakText,
  stopSpeaking,
  type SpeechRecognitionLike,
} from "@/lib/speech";
import { findContactByName, findContactByRelationship } from "@/lib/storage/contacts";
import { useApp } from "@/components/providers/app-provider";
import { BigButton } from "@/components/BigButton";
import { ConfirmCallDialog } from "@/components/ConfirmCallDialog";
import { VoiceStatus, type VoicePhase } from "@/components/VoiceStatus";
import { Textarea } from "@/components/ui/textarea";

function withQuery(path: string, args: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function toolPath(tool: ToolCall): string | null {
  switch (tool.name) {
    case "search_cabs":
      return withQuery("/services/cab", tool.args);
    case "search_flights":
      return withQuery("/services/flight", tool.args);
    case "search_bill_options":
      return withQuery("/services/bills", tool.args);
    case "search_nurse_services":
      return withQuery("/services/nurse", tool.args);
    case "search_blood_tests":
      return withQuery("/services/blood-test", tool.args);
    default:
      return null;
  }
}

export function VoiceAssistant({
  mode,
  greeting,
}: {
  mode: "help" | "talk";
  greeting: string;
}) {
  const { contacts, prefs, strings } = useApp();
  const router = useRouter();
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [pendingCall, setPendingCall] = useState<Contact | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pendingCallRef = useRef<Contact | null>(null);
  const offerFamilyRef = useRef(false);
  const listenAfterSpeakRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});
  const handleUtteranceRef = useRef<(text: string) => void>(() => {});
  const startedRef = useRef(false);

  const addLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-6), line]);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string, thenListen: boolean) => {
      stopListening();
      listenAfterSpeakRef.current = thenListen;
      setPhase("speaking");
      addLog(`UNK: ${text}`);
      speakText(text, {
        rate: prefs.voiceSpeed,
        lang: prefs.language,
        onend: () => {
          if (listenAfterSpeakRef.current) {
            window.setTimeout(() => startListeningRef.current(), 350);
          } else {
            setPhase("idle");
          }
        },
      });
    },
    [addLog, prefs.language, prefs.voiceSpeed, stopListening],
  );

  const confirmCall = useCallback(
    (contact: Contact) => {
      setPendingCall(null);
      pendingCallRef.current = null;
      if (!hasUsablePhoneNumber(contact.phoneNumber)) {
        speak(
          `${contact.name} has no phone number yet. Please add it in Settings.`,
          mode === "help",
        );
        return;
      }
      speak(`Calling ${contact.name} now.`, false);
      startPhoneCall(contact.phoneNumber);
    },
    [mode, speak],
  );

  const handleUtterance = useCallback(
    (transcript: string) => {
      const said = transcript.trim();
      if (!said) {
        speak("I did not hear that. Please say it again.", mode === "help");
        return;
      }
      addLog(`You: ${said}`);
      setPhase("processing");

      const interpreted = interpretUserSpeech(said, contacts);

      if (interpreted.spokenText === "YES_CONFIRM") {
        if (pendingCallRef.current) {
          confirmCall(pendingCallRef.current);
          return;
        }
        if (offerFamilyRef.current) {
          offerFamilyRef.current = false;
          speak("Opening your family list.", false);
          router.push("/family");
          return;
        }
        speak("Okay.", mode === "help");
        return;
      }

      if (interpreted.spokenText === "NO_CONFIRM") {
        setPendingCall(null);
        pendingCallRef.current = null;
        offerFamilyRef.current = false;
        speak("Okay. What else do you need?", mode === "help");
        return;
      }

      if (interpreted.toolCall?.name === "call_family_member") {
        const args = interpreted.toolCall.args;
        const contact =
          (args.relationship &&
            findContactByRelationship(contacts, args.relationship)) ||
          (args.name && findContactByName(contacts, args.name)) ||
          null;
        if (contact) {
          setPendingCall(contact);
          pendingCallRef.current = contact;
          speak(interpreted.spokenText, true);
          return;
        }
      }

      offerFamilyRef.current = Boolean(interpreted.offerFamilyCall);
      const path = interpreted.toolCall ? toolPath(interpreted.toolCall) : null;
      speak(interpreted.spokenText, mode === "help" && !path);
      if (path) {
        window.setTimeout(() => router.push(path), 1600);
      }
    },
    [addLog, confirmCall, contacts, mode, router, speak],
  );

  const startListening = useCallback(() => {
    stopSpeaking();
    const rec = getSpeechRecognition();
    if (!rec) {
      setVoiceSupported(false);
      setPhase("idle");
      return;
    }
    recognitionRef.current = rec;
    rec.lang = prefs.language === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      handleUtteranceRef.current(transcript);
    };
    rec.onerror = () => setPhase("idle");
    rec.onend = () => {
      setPhase((current) => (current === "listening" ? "idle" : current));
    };
    try {
      rec.start();
      setPhase("listening");
    } catch {
      setPhase("idle");
    }
  }, [prefs.language]);

  useEffect(() => {
    pendingCallRef.current = pendingCall;
  }, [pendingCall]);

  useEffect(() => {
    handleUtteranceRef.current = handleUtterance;
  }, [handleUtterance]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    speak(greeting, true);
    return () => {
      stopSpeaking();
      stopListening();
    };
    // Greeting once when this screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSendTyped() {
    const value = typed.trim();
    if (!value) return;
    setTyped("");
    handleUtterance(value);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <VoiceStatus
        phase={phase}
        listeningLabel={strings.listening}
        speakingLabel={strings.speaking}
        idleLabel={strings.tapToSpeak}
      />

      {!voiceSupported ? (
        <p className="rounded-2xl bg-[#FFF4CC] p-4 text-xl font-semibold text-[#0B1F3A]">
          {strings.voiceUnsupported}
        </p>
      ) : null}

      <div className="min-h-40 rounded-2xl border-4 border-[#0B1F3A] bg-white p-4 text-xl high-contrast:border-white high-contrast:bg-black">
        {log.length === 0 ? (
          <p className="opacity-70">{greeting}</p>
        ) : (
          <ul className="space-y-3">
            {log.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      <BigButton
        tone={phase === "listening" ? "help" : "primary"}
        icon={<Mic className="size-8" />}
        onClick={() => {
          if (phase === "listening") {
            stopListening();
            setPhase("idle");
          } else {
            startListening();
          }
        }}
      >
        {phase === "listening" ? strings.stop : strings.tapToSpeak}
      </BigButton>

      {mode === "talk" ? (
        <div className="flex flex-col gap-3">
          <label className="text-xl font-bold" htmlFor="unk-type">
            {strings.typeHere}
          </label>
          <Textarea
            id="unk-type"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="min-h-24 rounded-2xl border-4 border-[#0B1F3A] p-4 text-xl md:text-xl"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSendTyped();
              }
            }}
          />
          <BigButton tone="service" onClick={onSendTyped}>
            {strings.send}
          </BigButton>
        </div>
      ) : null}

      <ConfirmCallDialog
        contact={pendingCall}
        onClose={() => setPendingCall(null)}
        onConfirm={confirmCall}
      />
    </div>
  );
}
