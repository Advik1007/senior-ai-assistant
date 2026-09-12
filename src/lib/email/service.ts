import "server-only";

import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { AppLanguage } from "@/lib/languages";
import { createDeviceLoginLinks } from "@/lib/email/device-login-tokens";
import { newDeviceLoginEmail } from "@/lib/email/device-login-template";
import {
  bookingConfirmationEmail,
  contactEmail,
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
  type EmailTemplate,
} from "@/lib/email/templates";
import { RESEND_TEST_FROM } from "@/lib/email/resend-test";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

export class EmailDeliveryError extends Error {
  readonly code: "send_failed" | "resend_test_mode";

  constructor(code: "send_failed" | "resend_test_mode" = "send_failed") {
    super(
      code === "resend_test_mode"
        ? "Gmail SMTP is not set, so Resend test mode can only email the Resend account inbox. Set SMTP_PASS (free Gmail App Password for hello.unkai@gmail.com) to send to any address."
        : "The email could not be sent. Please try again later.",
    );
    this.name = "EmailDeliveryError";
    this.code = code;
  }
}

function requireEmail(value: string, label: string): string {
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error(`${label} must be a valid email address.`);
  }
  return email;
}

function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']+|["']+$/g, "");
}

function smtpPass(): string {
  return cleanEnv(process.env.SMTP_PASS).replace(/\s+/g, "");
}

function isResendTestFrom(from: string): boolean {
  return from.toLowerCase().includes(RESEND_TEST_FROM);
}

function smtpConfigured(): boolean {
  return Boolean(
    cleanEnv(process.env.SMTP_HOST) &&
      cleanEnv(process.env.SMTP_USER) &&
      smtpPass() &&
      cleanEnv(process.env.SMTP_FROM || process.env.RESEND_FROM_EMAIL),
  );
}

function resendProductionConfigured(): boolean {
  const key = cleanEnv(process.env.RESEND_API_KEY);
  const from = cleanEnv(process.env.RESEND_FROM_EMAIL);
  return Boolean(key && from && !isResendTestFrom(from));
}

/** True when we can send to any recipient (verified Resend domain or SMTP). */
export function isProductionEmailReady(): boolean {
  return resendProductionConfigured() || smtpConfigured();
}

async function deliverViaSmtp(input: {
  to: string;
  from: string;
  template: EmailTemplate;
  replyTo?: string;
}): Promise<{ id: string }> {
  const host = cleanEnv(process.env.SMTP_HOST);
  const port = Number(cleanEnv(process.env.SMTP_PORT) || "587");
  const user = cleanEnv(process.env.SMTP_USER);
  const pass = smtpPass();

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: input.from,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.template.subject,
    html: input.template.html,
    text: input.template.text,
  });

  return { id: String(info.messageId || `smtp-${Date.now()}`) };
}

async function deliverViaResend(input: {
  to: string;
  from: string;
  template: EmailTemplate;
  replyTo?: string;
}): Promise<{ id: string }> {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  if (!apiKey) {
    throw new EmailConfigurationError("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: input.from,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.template.subject,
      html: input.template.html,
      text: input.template.text,
    });

    if (error || !data?.id) {
      const detail = `${error?.message ?? ""} ${JSON.stringify(error ?? {})}`.toLowerCase();
      console.error("[email] Resend send failed:", error?.message ?? error);
      const testModeOnly =
        detail.includes("only send testing emails to your own email") ||
        detail.includes("you can only send testing emails") ||
        detail.includes("verify a domain");
      throw new EmailDeliveryError(
        testModeOnly ? "resend_test_mode" : "send_failed",
      );
    }

    return { id: data.id };
  } catch (error) {
    if (error instanceof EmailDeliveryError) throw error;
    const detail = errMessage(error).toLowerCase();
    console.error("[email] Resend threw:", errMessage(error));
    const testModeOnly =
      detail.includes("only send testing emails to your own email") ||
      detail.includes("you can only send testing emails") ||
      detail.includes("verify a domain");
    throw new EmailDeliveryError(
      testModeOnly ? "resend_test_mode" : "send_failed",
    );
  }
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err ?? "");
}

async function deliver(input: {
  to: string;
  template: EmailTemplate;
  replyTo?: string;
}): Promise<{ id: string; deliveredTo: string }> {
  const to = requireEmail(input.to, "Recipient");
  const replyTo = input.replyTo
    ? requireEmail(input.replyTo, "Reply-to")
    : undefined;

  if (smtpConfigured()) {
    const from =
      cleanEnv(process.env.SMTP_FROM) ||
      "UNK AI <hello.unkai@gmail.com>";
    try {
      const sent = await deliverViaSmtp({
        to,
        from,
        template: input.template,
        replyTo,
      });
      return { ...sent, deliveredTo: to };
    } catch (error) {
      console.error("[email] Gmail SMTP send failed:", errMessage(error));
      throw error instanceof EmailDeliveryError
        ? error
        : new EmailDeliveryError("send_failed");
    }
  }

  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  if (!apiKey) {
    throw new EmailConfigurationError("RESEND_API_KEY is not configured.");
  }

  const configuredFrom = cleanEnv(process.env.RESEND_FROM_EMAIL);
  const testMode = !configuredFrom || isResendTestFrom(configuredFrom);
  const from = testMode
    ? `UNK AI <${RESEND_TEST_FROM}>`
    : configuredFrom;

  const sent = await deliverViaResend({
    to,
    from,
    template: input.template,
    replyTo,
  });
  return { ...sent, deliveredTo: to };
}

export function sendWelcomeEmail(input: { to: string; name: string }) {
  return deliver({
    to: input.to,
    template: welcomeEmail(input.name.trim()),
  });
}

export function sendEmailVerification(input: {
  to: string;
  name: string;
  verificationUrl: string;
}) {
  return deliver({
    to: input.to,
    template: verificationEmail(
      input.name.trim(),
      requireActionUrl(input.verificationUrl),
    ),
  });
}

export function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  return deliver({
    to: input.to,
    template: passwordResetEmail(
      input.name.trim(),
      requireActionUrl(input.resetUrl),
    ),
  });
}

export function sendContactEmail(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const recipient = process.env.CONTACT_EMAIL;
  if (!recipient) {
    throw new EmailConfigurationError("CONTACT_EMAIL is not configured.");
  }

  return deliver({
    to: recipient,
    replyTo: input.email,
    template: contactEmail({
      name: input.name.trim(),
      email: requireEmail(input.email, "Email"),
      phone: (input.phone ?? "").trim(),
      message: input.message.trim(),
    }),
  });
}

export async function sendNewDeviceLoginAlert(input: {
  to: string;
  userName: string;
  lang: AppLanguage;
  deviceName: string;
  browser: string;
  location: string;
  time: string;
}) {
  const appUrl = process.env.APP_URL || "http://127.0.0.1:43141";
  const links = await createDeviceLoginLinks({
    userName: input.userName.trim(),
    userEmail: requireEmail(input.to, "Recipient"),
    lang: input.lang,
    details: {
      deviceName: input.deviceName.trim(),
      browser: input.browser.trim(),
      location: input.location.trim(),
      time: input.time.trim(),
    },
    appUrl,
  });

  return deliver({
    to: input.to,
    template: newDeviceLoginEmail({
      lang: input.lang,
      userName: input.userName.trim(),
      details: {
        deviceName: input.deviceName.trim(),
        browser: input.browser.trim(),
        location: input.location.trim(),
        time: input.time.trim(),
      },
      approveUrl: links.approveUrl,
      denyUrl: links.denyUrl,
    }),
  });
}

export function sendBookingEmail(input: {
  to: string;
  subject: string;
  body: string;
  confirmationId: string;
}) {
  if (!input.confirmationId.trim()) {
    throw new Error("A real confirmation ID is required.");
  }

  return deliver({
    to: input.to,
    template: bookingConfirmationEmail({
      subject: input.subject.trim(),
      body: input.body.trim(),
      confirmationId: input.confirmationId.trim(),
    }),
  });
}

function requireActionUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Email action URL must use HTTP or HTTPS.");
  }
  return url.toString();
}
