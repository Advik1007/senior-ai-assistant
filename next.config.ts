import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preview and phone browsers hit 127.0.0.1 while Next treats another host as origin.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Keep Capacitor native plugins in the client bundle for the Android WebView.
  transpilePackages: [
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/splash-screen",
    "@capgo/capacitor-speech-recognition",
  ],
};

export default nextConfig;
