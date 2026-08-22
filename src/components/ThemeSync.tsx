"use client";

import { useEffect } from "react";
import { useApp } from "@/components/providers/app-provider";

/** Applies text size, contrast, and language to the document. */
export function ThemeSync() {
  const { prefs, ready } = useApp();

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.lang = prefs.language === "hi" ? "hi" : "en";
    root.classList.toggle("high-contrast", prefs.highContrast);
    root.dataset.textSize = prefs.textSize;
    root.dataset.a11y = prefs.accessibilityMode ? "on" : "off";
  }, [prefs, ready]);

  return null;
}
