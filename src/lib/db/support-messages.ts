import "server-only";

import { getDb, ensureSchema } from "@/lib/db/client";

export type SupportMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
};

export async function ensureSupportMessagesTable(): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}

export async function saveSupportMessage(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<SupportMessage> {
  await ensureSupportMessagesTable();
  const db = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const phone = (input.phone ?? "").trim();

  await db.execute({
    sql: `INSERT INTO support_messages (id, name, email, phone, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.name.trim(),
      input.email.trim().toLowerCase(),
      phone,
      input.message.trim(),
      createdAt,
    ],
  });

  return {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone,
    message: input.message.trim(),
    createdAt,
  };
}

export async function listSupportMessages(
  limit = 100,
): Promise<SupportMessage[]> {
  await ensureSupportMessagesTable();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT id, name, email, phone, message, created_at
          FROM support_messages
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [Math.min(Math.max(limit, 1), 500)],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone ?? ""),
    message: String(row.message),
    createdAt: String(row.created_at),
  }));
}
