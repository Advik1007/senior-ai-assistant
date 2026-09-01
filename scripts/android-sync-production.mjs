#!/usr/bin/env node
/**
 * Sync Capacitor Android to load a production https UNK AI site.
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
UNK AI Android (production): set your https URL in .env.local:

  APP_URL=https://your-domain.com
  CAPACITOR_SERVER_URL=https://your-domain.com

Then run: npm run android:sync:prod
`);
  process.exit(1);
}

const host = new URL(url).host.toLowerCase();
const canonical = "senior-ai-assistant.vercel.app";
if (host !== canonical && host.endsWith(".vercel.app")) {
  console.error(`
Use the stable production URL, not a preview deployment link:

  APP_URL=https://${canonical}
  CAPACITOR_SERVER_URL=https://${canonical}

Preview URLs expire and return DEPLOYMENT_NOT_FOUND.
`);
  process.exit(1);
}

process.env.CAPACITOR_SERVER_URL = url;
process.env.APP_URL = process.env.APP_URL || url;

console.log(`Syncing Android app → ${url}`);
execSync("npx cap sync android", { stdio: "inherit", env: process.env });
console.log("Done. Open Android Studio: npm run android:open");
