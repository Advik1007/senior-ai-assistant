"use client";

import { useEffect } from "react";
import { useApp } from "@/components/providers/app-provider";
import { languageByCode } from "@/lib/languages";

/** Applies text size, contrast, and language to the document. */
export function ThemeSync() {
  const { prefs, ready } = useApp();

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const meta = languageByCode(prefs.language);
    root.lang = meta.htmlLang;
    root.dir = meta.rtl ? "rtl" : "ltr";
    root.classList.toggle("high-contrast", prefs.highContrast);
    root.dataset.textSize = prefs.textSize;
    root.dataset.a11y = prefs.accessibilityMode ? "on" : "off";
  }, [prefs, ready]);

  return null;
}
