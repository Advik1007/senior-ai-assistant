"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

/**
 * Android WebView often drops click. Start on pointerdown (finger down),
 * and ignore a following click. Never preventDefault — that can swallow the tap.
 */
export function useReliableTap<T extends HTMLElement>(
  onActivate?: (event: MouseEvent<T>) => void,
  disabled?: boolean,
) {
  const last = useRef(0);
  const activate = useRef(onActivate);
  activate.current = onActivate;

  function invoke(event: MouseEvent<T> | PointerEvent<T>) {
    if (!activate.current || disabled) return;
    const now = Date.now();
    if (now - last.current < 350) return;
    last.current = now;
    activate.current(event as MouseEvent<T>);
  }

  return {
    onPointerDown(event: PointerEvent<T>) {
      if (event.button > 0) return;
      invoke(event);
    },
    onClick(event: MouseEvent<T>) {
      invoke(event);
    },
  };
}
