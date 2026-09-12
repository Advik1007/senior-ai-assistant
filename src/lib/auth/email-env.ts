import "server-only";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function smtpConfigured(): boolean {
  return Boolean(
    clean(process.env.SMTP_HOST) &&
      clean(process.env.SMTP_USER) &&
      clean(process.env.SMTP_PASS).replace(/\s+/g, "") &&
      (clean(process.env.SMTP_FROM) || clean(process.env.RESEND_FROM_EMAIL)),
  );
}

export function getMissingEmailEnv(): string[] {
  const missing: string[] = [];
  const hasResendKey = Boolean(clean(process.env.RESEND_API_KEY));
  const hasSmtp = smtpConfigured();

  if (!hasResendKey && !hasSmtp) {
    missing.push("RESEND_API_KEY");
  }
  if (!clean(process.env.AUTH_SECRET)) missing.push("AUTH_SECRET");
  return missing;
}

/** True when we can attempt a login email (Resend API key or SMTP). */
export function isEmailEnvReady(): boolean {
  return (
    Boolean(clean(process.env.AUTH_SECRET)) &&
    (Boolean(clean(process.env.RESEND_API_KEY)) || smtpConfigured())
  );
}
