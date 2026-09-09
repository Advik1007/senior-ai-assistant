#!/usr/bin/env node
/**
 * Production Android release: sync HTTPS server URL → assembleRelease → inspect APK.
 *
 * Requires android/keystore.properties + matching keystore file (see keystore.properties.example).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(root, "android");
const keystoreProps = path.join(androidDir, "keystore.properties");
const outDir = path.join(root, "releases");

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, {
    stdio: "inherit",
    cwd: opts.cwd || root,
    env: { ...process.env, ...(opts.env || {}) },
  });
}

function resolveJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }
  const candidate = path.join(
    os.homedir(),
    "Library/Java/JavaVirtualMachines/jbr-21.0.11/Contents/Home",
  );
  if (fs.existsSync(path.join(candidate, "bin/java"))) return candidate;
  return "";
}

function resolveGradleBin() {
  const cachedRoot = path.join(
    os.homedir(),
    ".gradle/wrapper/dists/gradle-8.14.3-all",
  );
  if (fs.existsSync(cachedRoot)) {
    for (const e of fs.readdirSync(cachedRoot)) {
      const bin = path.join(
        cachedRoot,
        e,
        "gradle-8.14.3",
        "bin",
        process.platform === "win32" ? "gradle.bat" : "gradle",
      );
      if (fs.existsSync(bin)) return bin;
    }
  }
  return path.join(
    androidDir,
    process.platform === "win32" ? "gradlew.bat" : "gradlew",
  );
}

if (!fs.existsSync(keystoreProps)) {
  console.error(`
Missing ${path.relative(root, keystoreProps)}

1. Copy android/keystore.properties.example → android/keystore.properties
2. Generate a keystore (see the example file)
3. Re-run: npm run android:release
`);
  process.exit(1);
}

const javaHome = resolveJavaHome();
const env = {
  ...process.env,
  ...(javaHome
    ? {
        JAVA_HOME: javaHome,
        PATH: `${path.join(javaHome, "bin")}${path.delimiter}${process.env.PATH || ""}`,
      }
    : {}),
};

run("node scripts/android-sync-production.mjs", { env });

const gradleBin = resolveGradleBin();
run(`${JSON.stringify(gradleBin)} clean assembleRelease`, {
  cwd: androidDir,
  env,
});

const apkSrc = path.join(
  androidDir,
  "app/build/outputs/apk/release/app-release.apk",
);
const mappingSrc = path.join(
  androidDir,
  "app/build/outputs/mapping/release/mapping.txt",
);

if (!fs.existsSync(apkSrc)) {
  console.error("Release APK not found at", apkSrc);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const apkDest = path.join(outDir, `unk-ai-release-${stamp}.apk`);
const mappingDest = path.join(outDir, `mapping-release-${stamp}.txt`);

fs.copyFileSync(apkSrc, apkDest);
if (fs.existsSync(mappingSrc)) {
  fs.copyFileSync(mappingSrc, mappingDest);
}

console.log(`\nRelease APK: ${apkDest}`);
if (fs.existsSync(mappingDest)) {
  console.log(`R8 mapping (keep private): ${mappingDest}`);
}

run(`node scripts/inspect-release-apk.mjs ${JSON.stringify(apkDest)}`, { env });
