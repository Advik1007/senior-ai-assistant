import "server-only";

import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function resolveDbConfig(): { url: string; authToken?: string } {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "";
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

  // Remote Turso / libSQL (required for reliable Vercel production).
  if (tursoUrl.startsWith("libsql://") || tursoUrl.startsWith("https://")) {
    return { url: tursoUrl, authToken };
  }

  // Explicit file URL from env.
  if (tursoUrl.startsWith("file:")) {
    return { url: tursoUrl };
  }

  // Local SQLite. On Vercel the app directory is read-only, so use /tmp.
  const dataDir = process.env.VERCEL
    ? path.join("/tmp", "unk-data")
    : path.join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  return { url: `file:${path.join(dataDir, "unk.db")}` };
}

export function getDb(): Client {
  if (!client) {
    const config = resolveDbConfig();
    client = createClient({
      url: config.url,
      authToken: config.authToken,
    });
  }
  return client;
}

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getDb();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          lang TEXT NOT NULL DEFAULT 'en',
          created_at TEXT NOT NULL
        )
      `);
    })();
  }
  await schemaReady;
}
