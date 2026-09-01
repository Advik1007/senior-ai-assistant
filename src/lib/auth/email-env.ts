import "server-only";

export function getMissingEmailEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY?.trim()) missing.push("RESEND_API_KEY");
  if (!process.env.RESEND_FROM_EMAIL?.trim()) missing.push("RESEND_FROM_EMAIL");
  if (!process.env.AUTH_SECRET?.trim()) missing.push("AUTH_SECRET");
  return missing;
}

export function isEmailEnvReady(): boolean {
  return getMissingEmailEnv().length === 0;
}
