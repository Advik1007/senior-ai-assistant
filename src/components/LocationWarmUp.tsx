"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { warmUpNativeLocationPermission } from "@/lib/speech";

function isNativeAppShell(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // ignore
  }
  if (typeof window === "undefined") return false;
  const win = window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
    androidBridge?: unknown;
  };
  return Boolean(win.androidBridge || win.Capacitor?.isNativePlatform?.());
}

/** Ask for location as soon as the Android app opens. */
export function LocationWarmUp() {
  useEffect(() => {
    if (!isNativeAppShell()) return;
    const timer = window.setTimeout(() => {
      void warmUpNativeLocationPermission();
    }, 400);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
