"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

/**
 * Android WebView (especially from Android Studio) fires pointerup and then a
 * delayed click. Mic is a toggle, so that second event starts then immediately
 * stops listening. One physical tap must run the handler once.
 */
export function useReliableTap<T extends HTMLElement>(
  onActivate?: (event: MouseEvent<T>) => void,
  disabled?: boolean,
) {
  const tap = useRef({ x: 0, y: 0, at: 0, handledTouch: false });

  function invoke(event: MouseEvent<T>) {
    if (!onActivate || disabled) return;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - tap.current.at < 650) return;
    tap.current.at = now;
    onActivate(event);
  }

  function onPointerDown(event: PointerEvent<T>) {
    tap.current.x = event.clientX;
    tap.current.y = event.clientY;
  }

  function onPointerUp(event: PointerEvent<T>) {
    if (event.button > 0) return;
    if (event.pointerType === "mouse") return;
    const dx = event.clientX - tap.current.x;
    const dy = event.clientY - tap.current.y;
    if (dx * dx + dy * dy > 400) return;
    tap.current.handledTouch = true;
    invoke(event as unknown as MouseEvent<T>);
  }

  function onClick(event: MouseEvent<T>) {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (tap.current.handledTouch && now - tap.current.at < 2000) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    tap.current.handledTouch = false;
    invoke(event);
  }

  return { onPointerDown, onPointerUp, onClick };
}
