import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import type { AppLanguage } from "@/lib/languages";
import { isAppLanguage } from "@/lib/languages";
import { hashPassword } from "@/lib/auth/password";
import { ensureSchema, getDb } from "@/lib/db/client";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  lang: AppLanguage;
  setup_completed: boolean;
  created_at: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  lang: AppLanguage;
  setupCompleted: boolean;
};

function rowToUser(row: Record<string, unknown>): DbUser {
  const langRaw = String(row.lang ?? "en");
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    password_hash: String(row.password_hash),
    lang: (isAppLanguage(langRaw) ? langRaw : "en") as AppLanguage,
    setup_completed: Number(row.setup_completed ?? 0) === 1,
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
    sql: `INSERT INTO users (id, email, name, password_hash, lang, setup_completed, created_at)
          VALUES (?, ?, ?, ?, ?, 0, ?)`,
    args: [
      id,
      email,
      input.name.trim(),
      input.passwordHash,
      input.lang,
      createdAt,
    ],
  });

  return {
    id,
    email,
    name: input.name.trim(),
    lang: input.lang,
    setupCompleted: false,
  };
}

export function toPublicUser(user: DbUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    lang: user.lang,
    setupCompleted: user.setup_completed,
  };
}

export async function setUserSetupCompleted(
  userId: string,
  completed = true,
): Promise<PublicUser | null> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: "UPDATE users SET setup_completed = ? WHERE id = ?",
    args: [completed ? 1 : 0, userId],
  });
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE id = ? LIMIT 1",
    args: [userId],
  });
  const row = result.rows[0];
  if (!row) return null;
  return toPublicUser(rowToUser(row as unknown as Record<string, unknown>));
}

export async function setUserLanguage(
  userId: string,
  lang: AppLanguage,
): Promise<PublicUser | null> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: "UPDATE users SET lang = ? WHERE id = ?",
    args: [lang, userId],
  });
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE id = ? LIMIT 1",
    args: [userId],
  });
  const row = result.rows[0];
  if (!row) return null;
  return toPublicUser(rowToUser(row as unknown as Record<string, unknown>));
}

/** Magic-link users get a random password hash they never receive. */
export async function findOrCreateUserByEmail(input: {
  email: string;
  name?: string;
  lang: AppLanguage;
}): Promise<PublicUser> {
  const existing = await findUserByEmail(input.email);
  if (existing) return toPublicUser(existing);

  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
  return createUser({
    email: input.email,
    name: input.name?.trim() || input.email.split("@")[0] || "UNK user",
    passwordHash,
    lang: input.lang,
  });
}
