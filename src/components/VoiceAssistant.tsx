"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { interpretUserSpeech } from "@/lib/ai/local-assistant";
import { aiPhrase } from "@/lib/ai/phrases";
import {
  appendChatHistory,
  loadChatHistory,
  loadMemory,
  remember,
} from "@/lib/ai/memory";
import type { ToolCall } from "@/lib/ai/tools";
import type { Contact } from "@/lib/db/schema";
import { hasUsablePhoneNumber, startPhoneCall } from "@/lib/phone";
import {
  getSpeechRecognition,
  speakText,
  speechLocale,
  stopSpeaking,
  type SpeechRecognitionLike,
} from "@/lib/speech";
import { doctorsNearMeUrl, directionsUrl } from "@/lib/maps";
import { findContactByName, findContactByRelationship } from "@/lib/storage/contacts";
import { useApp } from "@/components/providers/app-provider";
import { BigButton } from "@/components/BigButton";
import { ConfirmCallDialog } from "@/components/ConfirmCallDialog";
import { VoiceStatus, type VoicePhase } from "@/components/VoiceStatus";
import { Textarea } from "@/components/ui/textarea";

function toolPath(tool: ToolCall): string | null {
  switch (tool.name) {
    case "open_medical":
      return "/medical";
    case "open_doctor_nearby":
      return "/doctor?nearby=1";
    case "open_shopping":
      return "/shopping";
    case "open_routine":
      return "/routine";
    case "open_help":
      return "/help";
    case "open_emergency":
      return "/emergency";
    case "open_directions": {
      const dest = tool.args.destination || "hospital";
      const mode = tool.args.mode || "driving";
      if (typeof window !== "undefined") {
        window.open(directionsUrl(dest, mode), "_blank", "noopener,noreferrer");
      }
      return null;
    }
    case "create_reminder":
      return "/routine";
    default:
      return null;
  }
}

function routeForTalkAction(type: string): string | null {
  switch (type) {
    case "open_medical":
      return "/medical";
    case "open_doctor_nearby":
      return "/doctor?nearby=1";
    case "open_shopping":
      return "/shopping";
    case "open_routine":
      return "/routine";
    case "open_emergency":
      return "/emergency";
    case "open_help":
      return "/help";
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
  const { contacts, prefs, strings, profile } = useApp();
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
          aiPhrase(prefs.language, "ai.noPhone", { name: contact.name }),
          mode === "help",
        );
        return;
      }
      speak(aiPhrase(prefs.language, "ai.calling", { name: contact.name }), false);
      startPhoneCall(contact.phoneNumber);
    },
    [mode, prefs.language, speak],
  );

  const handleUtterance = useCallback(
    (transcript: string) => {
      const said = transcript.trim();
      if (!said) {
        speak(aiPhrase(prefs.language, "ai.didNotHear"), mode === "help");
        return;
      }
      addLog(`You: ${said}`);
      setPhase("processing");

      const interpreted = interpretUserSpeech(said, contacts, prefs.language);

      if (interpreted.spokenText === "YES_CONFIRM") {
        if (pendingCallRef.current) {
          confirmCall(pendingCallRef.current);
          return;
        }
        if (offerFamilyRef.current) {
          offerFamilyRef.current = false;
          speak(aiPhrase(prefs.language, "ai.openingFamily"), false);
          router.push("/family");
          return;
        }
        speak(aiPhrase(prefs.language, "ai.okay"), mode === "help");
        return;
      }

      if (interpreted.spokenText === "NO_CONFIRM") {
        setPendingCall(null);
        pendingCallRef.current = null;
        offerFamilyRef.current = false;
        speak(aiPhrase(prefs.language, "ai.whatElse"), mode === "help");
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

      if (interpreted.toolCall) {
        offerFamilyRef.current = false;
        const path = toolPath(interpreted.toolCall);
        speak(interpreted.spokenText, false);
        if (path) window.setTimeout(() => router.push(path), 1600);
        return;
      }

      const useTalkApi = mode === "talk" || mode === "help";
      if (useTalkApi && !interpreted.spokenText && !interpreted.toolCall) {
        void (async () => {
          try {
            const memory = loadMemory();
            const history = loadChatHistory();
            const res = await fetch("/api/talk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: said,
                lang: prefs.language,
                userName:
                  profile.displayName ||
                  aiPhrase(prefs.language, "ai.friend"),
                history,
                memory,
              }),
            });
            const data = (await res.json()) as {
              reply?: string;
              action?: { type: string };
              memoryUpdates?: string[];
            };
            const reply =
              data.reply ||
              aiPhrase(prefs.language, "ai.default", {
                name:
                  profile.displayName ||
                  aiPhrase(prefs.language, "ai.friend"),
              });
            if (data.memoryUpdates?.length) {
              for (const fact of data.memoryUpdates) remember(fact);
            }
            appendChatHistory({ role: "user", content: said });
            appendChatHistory({ role: "assistant", content: reply });
            speak(reply, true);
            if (data.action?.type === "open_doctor_nearby") {
              window.setTimeout(() => {
                window.open(doctorsNearMeUrl(), "_blank", "noopener,noreferrer");
              }, 1600);
            } else {
              const path = data.action?.type
                ? routeForTalkAction(data.action.type)
                : null;
              if (path) window.setTimeout(() => router.push(path), 1600);
            }
          } catch {
            speak(aiPhrase(prefs.language, "ai.error"), true);
          }
        })();
        return;
      }

      if (interpreted.spokenText) {
        offerFamilyRef.current = Boolean(interpreted.offerFamilyCall);
        speak(interpreted.spokenText, mode === "help" || mode === "talk");
      }
    },
    [
      addLog,
      confirmCall,
      contacts,
      mode,
      prefs.language,
      profile.displayName,
      router,
      speak,
    ],
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
    rec.lang = speechLocale(prefs.language);
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

      <ConfirmCallDialog
        contact={pendingCall}
        onClose={() => setPendingCall(null)}
        onConfirm={confirmCall}
      />
    </div>
  );
}
