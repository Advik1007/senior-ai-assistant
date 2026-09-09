import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preview and phone browsers hit 127.0.0.1 while Next treats another host as origin.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Keep Capacitor native plugins in the client bundle for the Android WebView.
  transpilePackages: [
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/preferences",
    "@capacitor/splash-screen",
    "@capgo/capacitor-speech-recognition",
  ],
  // Force phones to download the APK instead of trying to “open” it as a page.
  async headers() {
    return [
      {
        source: "/downloads/:path*.apk",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="unk-ai.apk"',
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
