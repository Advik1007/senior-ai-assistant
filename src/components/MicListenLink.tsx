"use client";

import { Mic } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

/**
 * Android WebView in this app fires taps on links, not on <button>.
 * The home tiles work because they are links. The mic must be a link too.
 *
 * Fire once per physical tap. pointerdown + click on the same press used to
 * start listening then immediately stop it, so Android never got speech.
 */
export function MicListenLink({
  listening,
  label,
  onPress,
}: {
  listening: boolean;
  label: string;
  onPress: () => void;
}) {
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const last = useRef(0);
  const usedPointer = useRef(false);

  useLayoutEffect(() => {
    const el = document.getElementById("unk-mic-link");
    if (!el) return;
    let fire: ((event: Event) => void) | null = null;
    let opts: AddEventListenerOptions | null = null;
    const ready = window.setTimeout(() => {
      fire = (event: Event) => {
        if (event.type === "click") {
          event.preventDefault();
          if (usedPointer.current) {
            usedPointer.current = false;
            return;
          }
        } else {
          usedPointer.current = true;
        }
        const now = Date.now();
        if (now - last.current < 900) return;
        last.current = now;
        onPressRef.current();
      };
      opts = { capture: true };
      el.addEventListener("click", fire, opts);
      el.addEventListener("pointerdown", fire, opts);
    }, 400);
    return () => {
      window.clearTimeout(ready);
      if (fire && opts) {
        el.removeEventListener("click", fire, opts);
        el.removeEventListener("pointerdown", fire, opts);
      }
    };
  }, []);

  const box = listening
    ? "border-[#7A1212] bg-[#C62828] text-white"
    : "border-[#C49200] bg-[#F4B400] text-[#0B1F3A]";
  const disc = listening
    ? "bg-white text-[#C62828]"
    : "bg-[#0B1F3A] text-[#F4B400]";

  return (
    <a
      id="unk-mic-link"
      href="#unk-listen"
      className={`relative z-30 flex min-h-28 w-full cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left no-underline ${box}`}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "rgba(244,180,0,0.45)" }}
    >
      <span
        className={`flex size-16 shrink-0 items-center justify-center rounded-full ${disc}`}
        aria-hidden
      >
        <Mic className="size-8" />
      </span>
      <span className="text-2xl font-bold">{label}</span>
    </a>
  );
}
