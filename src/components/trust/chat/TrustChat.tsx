"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wordmark } from "@/components/trust/brand/Wordmark";
import { Composer } from "@/components/trust/chat/Composer";
import { EmptyState } from "@/components/trust/chat/EmptyState";
import { ErrorBanner } from "@/components/trust/chat/ErrorBanner";
import { MessageList } from "@/components/trust/chat/MessageList";
import type { ChatMessage, TrustEnvelope, TrustRuntime } from "@/lib/trust/types";

function uid() {
  return `m_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function TrustChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [runtime, setRuntime] = useState<TrustRuntime | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [bridgeHint, setBridgeHint] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const priorRef = useRef<TrustEnvelope | null>(null);
  const lastUserRef = useRef<string>("");

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/trust/health");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setHealthError(
            data.detail ||
              "Local inference server is offline. Start it with: python -m trust_ai.server",
          );
          return;
        }
        setRuntime(data);
        setHealthError(null);
      } catch {
        if (!cancelled) {
          setHealthError(
            "Couldn’t reach the Trust AI inference server on port 8742. Start it, then retry.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || streaming) return;

      lastUserRef.current = text;
      const userMsg: ChatMessage = { id: uid(), role: "user", content: text, status: "complete" };
      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", status: "streaming" },
      ]);
      setDraft("");
      setStreaming(true);
      setBridgeHint(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/trust/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            stream: true,
            prior: priorRef.current,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles",
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "Request failed");
          throw new Error(errText || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assembled = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const evt = JSON.parse(line) as {
              type: string;
              text?: string;
              runtime?: TrustRuntime;
              envelope?: TrustEnvelope;
              labels?: { note?: string };
            };
            if (evt.type === "meta" && evt.runtime) {
              setRuntime(evt.runtime);
            }
            if (evt.type === "token" && evt.text) {
              assembled += evt.text;
              const snapshot = assembled;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: snapshot, status: "streaming" }
                    : m,
                ),
              );
            }
            if (evt.type === "done") {
              if (evt.envelope) priorRef.current = evt.envelope;
              if (evt.runtime) setRuntime(evt.runtime);
              const finalText = evt.envelope?.assistant_message || assembled;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: finalText,
                        status: "complete",
                        envelope: evt.envelope ?? null,
                      }
                    : m,
                ),
              );
              if (evt.envelope?.needs_user_confirmation) {
                setBridgeHint("Google action drafted — confirm before any Gemini call.");
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: m.content || "Stopped.",
                    status: "complete",
                  }
                : m,
            ),
          );
        } else {
          const detail =
            err instanceof Error ? err.message : "Local model request failed.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: "Couldn’t reach the local organizer. Your draft is still in the composer if you retry.",
                    status: "error",
                    error: detail,
                  }
                : m,
            ),
          );
          setDraft(lastUserRef.current);
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming],
  );

  const onRetry = useCallback(
    (messageId: string) => {
      const failed = messages.find((m) => m.id === messageId);
      if (!failed) return;
      // Remove error turn and resend last user text.
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      void sendText(lastUserRef.current || draft);
    },
    [messages, draft, sendText],
  );

  return (
    <div className="trust-shell flex h-dvh flex-col">
      <a href="#trust-composer-focus" className="trust-skip">
        Skip to composer
      </a>
      <header className="flex items-center justify-between gap-3 border-b border-[var(--trust-line)] px-4 py-3 sm:px-6">
        <Wordmark size="rail" />
        <div className="text-right text-[0.7rem] leading-snug text-[var(--trust-ink-muted)]">
          {runtime ? (
            <>
              <p>
                Local · {runtime.reply_source === "structured-organizer" ? "Organizer" : runtime.reply_source}
              </p>
              <p className="tabular-nums">
                {runtime.model_id?.split("/").pop()} · {runtime.device}
                {runtime.mps_available ? " · MPS" : ""}
              </p>
            </>
          ) : (
            <p>Checking local runtime…</p>
          )}
        </div>
      </header>

      {healthError ? (
        <div className="px-3 pt-3 sm:px-6">
          <ErrorBanner
            title="Inference offline"
            detail={healthError}
            actionLabel="Retry health check"
            onAction={() => window.location.reload()}
          />
        </div>
      ) : null}
      {bridgeHint ? (
        <div className="mx-auto w-full max-w-3xl px-3 pt-3 text-sm text-[var(--trust-ink-muted)] sm:px-6">
          {bridgeHint}
        </div>
      ) : null}

      {messages.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center px-4 sm:px-8">
          <EmptyState
            reducedMotion={reducedMotion}
            onStarter={(prompt) => {
              setDraft(prompt);
              void sendText(prompt);
            }}
          />
        </div>
      ) : (
        <MessageList
          messages={messages}
          onRetry={onRetry}
          onAddToCalendar={() => void sendText("add to calendar")}
          onConfirmGoogle={() => void sendText("confirm")}
          onCancelGoogle={() => void sendText("cancel")}
        />
      )}

      <div id="trust-composer-focus">
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={() => void sendText(draft)}
          onStop={stop}
          streaming={streaming}
          disabled={Boolean(healthError) && !streaming}
        />
      </div>
    </div>
  );
}
