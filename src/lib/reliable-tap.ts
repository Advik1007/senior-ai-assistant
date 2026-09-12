"use client";

import { useRef, type MouseEvent, type TouchEvent } from "react";

/**
 * Android WebView often never fires click if we wait on pointer events.
 * Fire on touchend, and ignore the delayed click that may follow.
 */
export function useReliableTap<T extends HTMLElement>(
  onActivate?: (event: MouseEvent<T>) => void,
  disabled?: boolean,
) {
  const last = useRef(0);

  function invoke(event: MouseEvent<T> | TouchEvent<T>) {
    if (!onActivate || disabled) return;
    const now = Date.now();
    if (now - last.current < 500) return;
    last.current = now;
    onActivate(event as MouseEvent<T>);
  }

  return {
    onClick(event: MouseEvent<T>) {
      invoke(event);
    },
    onTouchEnd(event: TouchEvent<T>) {
      if (event.cancelable) event.preventDefault();
      invoke(event);
    },
  };
}
