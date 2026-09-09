#!/usr/bin/env node
/**
 * Sync Capacitor Android to load the Vercel-hosted UNK AI site.
 * Requires CAPACITOR_SERVER_URL or APP_URL in .env.local (https://...).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(fileName) {
  const file = path.join(process.cwd(), fileName);
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

loadEnvFile(".env.local");
loadEnvFile(".env.production.local");

const url = (
  process.env.CAPACITOR_SERVER_URL ||
  process.env.APP_URL ||
  ""
).trim();

if (!url.startsWith("https://")) {
  console.error(`
UNK AI Android (Vercel): set your production URL in .env.local:

  APP_URL=https://YOUR-PROJECT.vercel.app
  CAPACITOR_SERVER_URL=https://YOUR-PROJECT.vercel.app

Use the same https URL you set in the Vercel dashboard for APP_URL.
Then run: npm run android:sync:prod
`);
  process.exit(1);
}

process.env.CAPACITOR_SERVER_URL = url;
process.env.APP_URL = process.env.APP_URL || url;

// Keep offline auto-reload pointed at the same production URL.
fs.writeFileSync(
  path.join(process.cwd(), "public", "offline-config.js"),
  `/** Written by android:sync:prod — do not edit by hand. */\n` +
    `window.UNK_SERVER_URL = ${JSON.stringify(url)};\n`,
);

console.log(`Syncing Android app → ${url}`);

// Don't pack install APKs into Capacitor assets (bloat + wrong surface).
const downloadsDir = path.join(process.cwd(), "public", "downloads");
const moved = [];
if (fs.existsSync(downloadsDir)) {
  for (const name of fs.readdirSync(downloadsDir)) {
    if (!name.endsWith(".apk")) continue;
    const from = path.join(downloadsDir, name);
    const to = path.join(process.cwd(), `.tmp-${name}.bak`);
    fs.renameSync(from, to);
    moved.push({ from, to });
  }
}

try {
  execSync("npx cap sync android", { stdio: "inherit", env: process.env });
} finally {
  for (const { from, to } of moved) {
    if (fs.existsSync(to)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
      fs.renameSync(to, from);
    }
  }
}

console.log("Done. Open Android Studio: npm run android:open");
