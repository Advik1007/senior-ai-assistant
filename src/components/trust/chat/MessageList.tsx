"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/trust/types";
import { MessageBubble } from "@/components/trust/chat/MessageBubble";

type Props = {
  messages: ChatMessage[];
  onRetry: (messageId: string) => void;
  onAddToCalendar: () => void;
  onConfirmGoogle: () => void;
  onCancelGoogle: () => void;
};

export function MessageList({
  messages,
  onRetry,
  onAddToCalendar,
  onConfirmGoogle,
  onCancelGoogle,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setStick(nearBottom);
      setShowJump(!nearBottom);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stick) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, stick]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        className="h-full overflow-y-auto px-3 py-4 sm:px-6"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onRetry={m.status === "error" ? () => onRetry(m.id) : undefined}
              onAddToCalendar={onAddToCalendar}
              onConfirmGoogle={onConfirmGoogle}
              onCancelGoogle={onCancelGoogle}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      {showJump ? (
        <button
          type="button"
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[var(--trust-line)] bg-[var(--trust-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--trust-ink)] shadow-sm"
          onClick={() => {
            setStick(true);
            bottomRef.current?.scrollIntoView({ block: "end" });
          }}
        >
          Jump to latest
        </button>
      ) : null}
    </div>
  );
}
