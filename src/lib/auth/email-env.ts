import "server-only";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function smtpConfigured(): boolean {
  return Boolean(
    clean(process.env.SMTP_HOST) &&
      clean(process.env.SMTP_USER) &&
      clean(process.env.SMTP_PASS).replace(/\s+/g, ""),
  );
}

export function getMissingEmailEnv(): string[] {
  const missing: string[] = [];
  if (!smtpConfigured()) {
    if (!clean(process.env.SMTP_HOST)) missing.push("SMTP_HOST");
    if (!clean(process.env.SMTP_USER)) missing.push("SMTP_USER");
    if (!clean(process.env.SMTP_PASS).replace(/\s+/g, "")) missing.push("SMTP_PASS");
  }
  if (!clean(process.env.AUTH_SECRET)) missing.push("AUTH_SECRET");
  return missing;
}

/** True when Gmail SMTP and AUTH_SECRET can send a login email. */
export function isEmailEnvReady(): boolean {
  return Boolean(clean(process.env.AUTH_SECRET)) && smtpConfigured();
}
