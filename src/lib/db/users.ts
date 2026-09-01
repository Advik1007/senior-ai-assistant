import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import type { AppLanguage } from "@/lib/languages";
import { hashPassword } from "@/lib/auth/password";
import { ensureSchema, getDb } from "@/lib/db/client";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  lang: AppLanguage;
  created_at: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  lang: AppLanguage;
};

function rowToUser(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    password_hash: String(row.password_hash),
    lang: String(row.lang) as AppLanguage,
    created_at: String(row.created_at),
  };
}

export async function findUserByEmail(
  email: string,
): Promise<DbUser | null> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
    args: [email.trim().toLowerCase()],
  });
  const row = result.rows[0];
  if (!row) return null;
  return rowToUser(row as unknown as Record<string, unknown>);
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  lang: AppLanguage;
}): Promise<PublicUser> {
  await ensureSchema();
  const db = getDb();
  const id = randomUUID();
  const email = input.email.trim().toLowerCase();
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO users (id, email, name, password_hash, lang, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      email,
      input.name.trim(),
      input.passwordHash,
      input.lang,
      createdAt,
    ],
  });

  return { id, email, name: input.name.trim(), lang: input.lang };
}

export function toPublicUser(user: DbUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    lang: user.lang,
  };
}

/** Magic-link users get a random password hash they never receive. */
export async function findOrCreateUserByEmail(input: {
  email: string;
  name?: string;
  lang: AppLanguage;
}): Promise<PublicUser> {
  const existing = await findUserByEmail(input.email);
  if (existing) return toPublicUser(existing);

  const passwordHash = await hashPassword(
    randomBytes(32).toString("hex"),
  );
  return createUser({
    email: input.email,
    name: input.name?.trim() || input.email.split("@")[0] || "UNK user",
    passwordHash,
    lang: input.lang,
  });
}
