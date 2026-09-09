#!/usr/bin/env node
/**
 * Defensive inspection of a release APK (strings / zip listing).
 * Does not claim the package is unreverse-engineerable.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const apk = process.argv[2];
if (!apk || !fs.existsSync(apk)) {
  console.error("Usage: node scripts/inspect-release-apk.mjs <path-to.apk>");
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "unk-apk-inspect-"));
const unzipped = path.join(tmp, "apk");
fs.mkdirSync(unzipped);

try {
  execSync(`unzip -q -o ${JSON.stringify(apk)} -d ${JSON.stringify(unzipped)}`, {
    stdio: "pipe",
  });
} catch {
  console.error("Failed to unzip APK (need `unzip` on PATH).");
  process.exit(1);
}

const findings = [];
const suspicious =
  /AUTH_SECRET|RESEND_API_KEY|TURSO_AUTH|GEMINI_API|AI_API_KEY|BEGIN (RSA |OPENSSH )?PRIVATE|sk-[a-zA-Z0-9]{20,}|password\s*=\s*['\"][^'\"]+['\"]|INBOX_SECRET/i;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (st.size < 2_000_000) {
      let buf;
      try {
        buf = fs.readFileSync(full);
      } catch {
        continue;
      }
      const text = buf.toString("utf8");
      if (suspicious.test(text)) {
        findings.push(path.relative(unzipped, full));
      }
    }
  }
}

walk(unzipped);

const assetsPublic = path.join(unzipped, "assets", "public");
const hasSourceMaps = fs.existsSync(assetsPublic)
  ? execSync(`find ${JSON.stringify(assetsPublic)} -name '*.map' 2>/dev/null || true`, {
      encoding: "utf8",
    }).trim()
  : "";

const capConfigPath = path.join(unzipped, "assets", "capacitor.config.json");
let serverUrl = null;
if (fs.existsSync(capConfigPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(capConfigPath, "utf8"));
    serverUrl = cfg?.server?.url || null;
  } catch {
    /* ignore */
  }
}

console.log("\n=== Release APK inspection ===");
console.log("APK:", apk);
console.log("Size:", fs.statSync(apk).size, "bytes");
console.log("Capacitor server.url:", serverUrl || "(none)");
console.log(
  "Cleartext allowed in config:",
  (() => {
    try {
      const cfg = JSON.parse(fs.readFileSync(capConfigPath, "utf8"));
      return Boolean(cfg?.server?.cleartext);
    } catch {
      return "unknown";
    }
  })(),
);
console.log("Bundled .map files:", hasSourceMaps ? hasSourceMaps : "none found in assets/public");
console.log(
  "Suspicious secret-like strings in unpacked files:",
  findings.length ? findings.join(", ") : "none matched",
);

const dexes = fs
  .readdirSync(unzipped)
  .filter((f) => f.endsWith(".dex"))
  .join(", ");
console.log("DEX files:", dexes || "none");

// Show a few high-level zip entries
const entries = execSync(`unzip -l ${JSON.stringify(apk)} | head -40`, {
  encoding: "utf8",
});
console.log("\nZip listing (first lines):\n" + entries);

fs.rmSync(tmp, { recursive: true, force: true });
console.log("Inspection complete.");
