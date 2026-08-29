import "server-only";

import { Resend } from "resend";
import {
  bookingConfirmationEmail,
  contactEmail,
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
  type EmailTemplate,
} from "@/lib/email/templates";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

export class EmailDeliveryError extends Error {
  constructor() {
    super("The email could not be sent. Please try again later.");
    this.name = "EmailDeliveryError";
  }
}

function requireEmail(value: string, label: string): string {
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error(`${label} must be a valid email address.`);
  }
  return email;
}

function getConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new EmailConfigurationError("RESEND_API_KEY is not configured.");
  }
  if (!from) {
    throw new EmailConfigurationError("RESEND_FROM_EMAIL is not configured.");
  }

  return { resend: new Resend(apiKey), from };
}

async function deliver(input: {
  to: string;
  template: EmailTemplate;
  replyTo?: string;
}): Promise<{ id: string }> {
  const { resend, from } = getConfig();
  const to = requireEmail(input.to, "Recipient");
  const replyTo = input.replyTo
    ? requireEmail(input.replyTo, "Reply-to")
    : undefined;

  const { data, error } = await resend.emails.send({
    from,
    to,
    replyTo,
    subject: input.template.subject,
    html: input.template.html,
    text: input.template.text,
  });

  if (error || !data?.id) {
    // Do not include provider details because they may contain user data.
    throw new EmailDeliveryError();
  }

  return { id: data.id };
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
      message: input.message.trim(),
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

