import fs from "node:fs";
import path from "node:path";
import type { CapacitorConfig } from "@capacitor/cli";

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;

  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

/**
 * UNK AI loads the Next.js site from a server URL (local dev or production).
 * Production: CAPACITOR_SERVER_URL and APP_URL = https://senior-ai-assistant-pmvo6m8h7-advik1007.vercel.app
 * Then run: npm run android:sync:prod
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.APP_URL?.trim() ||
  "";

const isHttps = serverUrl.startsWith("https://");
const isHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "ai.unk.app",
  appName: "UNK AI",
  webDir: "public",
  server: {
    ...(serverUrl
      ? {
          url: serverUrl,
          // Cleartext only for local HTTP dev — never for production HTTPS.
          cleartext: isHttp,
          androidScheme: isHttps ? "https" : "http",
        }
      : {}),
    // Local loading page + auto-retry instead of Chrome "webpage could not be loaded"
    errorPath: "offline.html",
  },
  android: {
    // Mixed content only when debugging over HTTP; production HTTPS stays strict.
    allowMixedContent: isHttp,
    // Explicit: accidental pinch/double-tap must not scale the UI.
    zoomEnabled: false,
  },
  zoomEnabled: false,
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      // Short timer; JS also hides on first paint (see SplashReady).
      launchShowDuration: 400,
      backgroundColor: "#0B4F8A",
      showSpinner: false,
    },
  },
};

export default config;
