#!/usr/bin/env node
/**
 * Push email/auth env vars from .env.local to Vercel Production.
 * Requires: npx vercel login && npx vercel link (once)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const KEYS = [
  "AUTH_SECRET",
  "APP_URL",
  "CAPACITOR_SERVER_URL",
];
const OPTIONAL = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "GEMINI_API_KEY",
  "AI_MODEL",
];

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) {
    console.error("Missing .env.local — copy from .env.example and fill in values.");
    process.exit(1);
  }

  const values = {};
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
    values[key] = value;
  }
  return values;
}

const values = loadEnvLocal();
const missing = KEYS.filter((key) => !values[key]?.trim());
if (missing.length) {
  console.error(`Fill these in .env.local first: ${missing.join(", ")}`);
  process.exit(1);
}

const toPush = [
  ...KEYS,
  ...OPTIONAL.filter((key) => values[key]?.trim()),
];

const targets = "production,preview,development";

console.log(`Pushing env vars to Vercel (${targets})…\n`);

for (const key of toPush) {
  let value = values[key];
  if (key === "SMTP_PASS") value = value.replace(/\s+/g, "");
  const sensitive =
    key === "SMTP_PASS" || key === "AUTH_SECRET" || key === "GEMINI_API_KEY"
      ? ["--sensitive"]
      : ["--no-sensitive"];
  execSync(
    `npx vercel env add ${key} ${targets} --yes --force ${sensitive.join(" ")} --project senior-ai-assistant --scope advik1007`,
    {
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
    },
  );
  console.log(`✓ ${key}`);
}

console.log("\nDone. Redeploy (or push) so the live app picks up Gmail SMTP.");
