"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  listenOnce,
  cancelListen,
  speakText,
  stopSpeaking,
} from "@/lib/speech";
import { doctorsNearMeUrl, directionsUrl } from "@/lib/maps";
import { findContactByName, findContactByRelationship } from "@/lib/storage/contacts";
import { addRoutine } from "@/lib/storage/routines";
import { useApp } from "@/components/providers/app-provider";
import { BigButton } from "@/components/BigButton";
import { MicListenLink } from "@/components/MicListenLink";
import { ConfirmCallDialog } from "@/components/ConfirmCallDialog";
import {
  VoiceStatus,
  type VoicePhase,
} from "@/components/VoiceStatus";
import { Textarea } from "@/components/ui/textarea";

function applyCreateReminder(args: {
  title?: string;
  time?: string;
  days?: string;
  date?: string;
  kind?: "reminder" | "medicine" | "appointment" | "task";
}): string {
  const title = args.title?.trim() || "Reminder";
  addRoutine({
    title,
    time: args.time?.trim() || "",
    days: args.days?.trim() || (args.date ? "once" : "recurring"),
    date: args.date,
    kind: args.kind || "reminder",
  });
  return args.date
    ? `/routine?date=${encodeURIComponent(args.date)}`
    : "/routine";
}

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
    case "create_reminder": {
      // Local assistant may have already saved; saving again with same content is ok (new id).
      // Prefer navigating to the date without double-adding when title already just saved.
      if (tool.args.date) {
        return `/routine?date=${encodeURIComponent(tool.args.date)}`;
      }
      return "/routine";
    }
    default:
      return null;
  }
}

function routeForTalkAction(
  action: { type: string } & Record<string, unknown>,
): string | null {
  switch (action.type) {
    case "open_medical":
      return "/medical";
    case "open_doctor_nearby":
      return "/doctor?nearby=1";
    case "open_shopping":
      return "/shopping";
    case "open_routine": {
      const date = typeof action.date === "string" ? action.date : undefined;
      return date ? `/routine?date=${encodeURIComponent(date)}` : "/routine";
    }
    case "create_reminder":
      return applyCreateReminder({
        title: typeof action.title === "string" ? action.title : undefined,
        time: typeof action.time === "string" ? action.time : undefined,
        days: typeof action.days === "string" ? action.days : undefined,
        date: typeof action.date === "string" ? action.date : undefined,
        kind:
          action.kind === "appointment" ||
          action.kind === "medicine" ||
          action.kind === "task" ||
          action.kind === "reminder"
            ? action.kind
            : "reminder",
      });
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
  const [micHint, setMicHint] = useState<string | null>(null);
  const [micBusy, setMicBusy] = useState(false);

  const pendingCallRef = useRef<Contact | null>(null);
  const offerFamilyRef = useRef(false);
  const listenAfterSpeakRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});
  const handleUtteranceRef = useRef<(text: string) => void>(() => {});
  const startedRef = useRef(false);
  const listenGenRef = useRef(0);

  const addLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-6), line]);
  }, []);

  const stopListening = useCallback(() => {
    listenGenRef.current += 1;
    setMicBusy(false);
    void cancelListen();
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
              action?: { type: string } & Record<string, unknown>;
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
            } else if (data.action) {
              const path = routeForTalkAction(data.action);
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
    const gen = ++listenGenRef.current;
    stopSpeaking();
    setMicHint(null);
    setVoiceSupported(true);
    setMicBusy(true);
    setPhase("listening");

    void (async () => {
      const result = await listenOnce({
        lang: prefs.language,
        prompt: "Speak now — UNK is listening",
      });
      if (gen !== listenGenRef.current) return;

      setMicBusy(false);

      if (result.ok) {
        handleUtteranceRef.current(result.transcript);
        return;
      }

      if (result.error === "denied") {
        setMicHint(
          "Microphone permission is blocked. Open phone Settings → Apps → UNK AI → Permissions → Microphone → Allow, then tap again.",
        );
      } else if (result.error === "unavailable") {
        setVoiceSupported(false);
        setMicHint(
          "Speech recognition is not available on this phone. You can still type below.",
        );
      } else if (result.error === "no-speech") {
        setMicHint("I did not catch that. Tap the mic and speak again.");
      } else if (result.error === "busy") {
        setMicHint("Microphone is busy. Wait a second, then tap again.");
      } else if (result.error === "canceled") {
        setMicHint("Tap the gold button, then speak when the phone says it is listening.");
      } else {
        setMicHint(
          "Could not start the microphone. Check Microphone permission, then tap again.",
        );
      }
      setPhase("idle");
    })();
  }, [prefs.language]);

  function toggleMic() {
    if (phase === "listening" || micBusy) {
      stopListening();
      setPhase("idle");
      return;
    }
    startListening();
  }

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
    speak(greeting, false);
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

      <MicListenLink
        listening={phase === "listening" || micBusy}
        label={
          phase === "listening" || micBusy ? strings.stop : strings.tapToSpeak
        }
        onPress={toggleMic}
      />

      {!voiceSupported ? (
        <p className="rounded-2xl bg-[#FFF4CC] p-4 text-xl font-semibold text-[#0B1F3A]">
          {strings.voiceUnsupported}
        </p>
      ) : null}

      {micHint ? (
        <p
          className="rounded-2xl border border-[#C62828]/30 bg-[#FFF5F5] p-4 text-base font-semibold text-[#C62828]"
          role="status"
        >
          {micHint}
        </p>
      ) : null}

      <div className="min-h-36 rounded-2xl border border-[#0B4F8A]/20 bg-white p-4 text-lg high-contrast:border-white high-contrast:bg-black">
        {log.length === 0 ? (
          <p className="text-[#5A6B7D]">{greeting}</p>
        ) : (
          <ul className="space-y-2">
            {log.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
          <label className="text-lg font-bold" htmlFor="unk-type">
            {strings.typeHere}
          </label>
          <Textarea
            id="unk-type"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="min-h-20 rounded-2xl border border-[#0B4F8A]/20 p-4 text-lg md:text-lg"
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
