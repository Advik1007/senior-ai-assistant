"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/** Hide native splash as soon as React mounts (don't wait for 400–1200ms timer). */
export function SplashReady() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void import("@capacitor/splash-screen")
      .then(({ SplashScreen }) => SplashScreen.hide())
      .catch(() => undefined);
  }, []);
  return null;
}
