import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller client chunks — lucide icons otherwise inflate the Android WebView parse.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Strip noisy client console.* from production bundles (keeps error).
  // Browser source maps are off by default for `next build` — do not enable them for production.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error"] }
        : false,
  },
  // Preview and phone browsers hit 127.0.0.1 while Next treats another host as origin.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Keep Capacitor native plugins in the client bundle for the Android WebView.
  transpilePackages: [
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/preferences",
    "@capacitor/splash-screen",
    "@capacitor/local-notifications",
    "@capgo/capacitor-speech-recognition",
  ],
  // Force phones to download APKs instead of trying to “open” them as pages.
  async headers() {
    return [
      {
        source: "/talk",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/home",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/downloads/:path*.apk",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="unk-ai-release.apk"',
          },
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
