const BRAND = "UNK AI";
const TAGLINE = "Think beyond the known.";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function layout({
  preview,
  heading,
  body,
  action,
}: {
  preview: string;
  heading: string;
  body: string;
  action?: { label: string; url: string };
}): string {
  const actionHtml = action
    ? `<p style="margin:32px 0">
        <a href="${escapeHtml(action.url)}" style="display:inline-block;background:#0b4f8a;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px">
          ${escapeHtml(action.label)}
        </a>
      </p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;background:#f3f7fb;color:#0b1f3a;font-family:Arial,Helvetica,sans-serif">
    <span style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7fb;padding:24px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #d8e4ef;border-radius:20px;overflow:hidden">
            <tr>
              <td style="background:#0b1f3a;color:#fff;padding:28px 32px">
                <div style="font-size:28px;font-weight:800">${BRAND}</div>
                <div style="margin-top:6px;color:#cfe6fa;font-size:15px">${TAGLINE}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px">
                <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25">${escapeHtml(heading)}</h1>
                <div style="font-size:17px;line-height:1.65;color:#29445e">${body}</div>
                ${actionHtml}
                <p style="margin:32px 0 0;font-size:14px;line-height:1.5;color:#60758a">
                  If you did not request this message, you can safely ignore it.
                </p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e3ebf2;padding:20px 32px;font-size:13px;color:#60758a">
                ${BRAND} · ${TAGLINE}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export function welcomeEmail(name: string): EmailTemplate {
  return {
    subject: "Welcome to UNK AI",
    html: layout({
      preview: "Welcome to UNK AI.",
      heading: `Welcome, ${name || "there"}!`,
      body: `<p style="margin:0">We’re glad you’re here. UNK AI is ready to make everyday tasks simpler and more accessible.</p>
        <p style="margin:18px 0 0">Whenever you need help, just open UNK AI and ask.</p>`,
    }),
    text: `Welcome, ${name || "there"}!\n\nWe’re glad you’re here. UNK AI is ready to make everyday tasks simpler and more accessible.\n\n${TAGLINE}`,
  };
}

export function verificationEmail(
  name: string,
  verificationUrl: string,
): EmailTemplate {
  return {
    subject: "Verify your UNK AI email",
    html: layout({
      preview: "Verify your email address for UNK AI.",
      heading: "Verify your email",
      body: `<p style="margin:0">Hi ${escapeHtml(name || "there")}, please confirm that this email address belongs to you.</p>
        <p style="margin:18px 0 0">This link expires for your security.</p>`,
      action: { label: "Verify email", url: verificationUrl },
    }),
    text: `Hi ${name || "there"},\n\nVerify your UNK AI email:\n${verificationUrl}\n\nThis link expires for your security.`,
  };
}

export function passwordResetEmail(
  name: string,
  resetUrl: string,
): EmailTemplate {
  return {
    subject: "Reset your UNK AI password",
    html: layout({
      preview: "Reset your UNK AI password.",
      heading: "Reset your password",
      body: `<p style="margin:0">Hi ${escapeHtml(name || "there")}, we received a request to reset your password.</p>
        <p style="margin:18px 0 0">Use the secure link below to choose a new password. This link expires for your security.</p>`,
      action: { label: "Reset password", url: resetUrl },
    }),
    text: `Hi ${name || "there"},\n\nReset your UNK AI password:\n${resetUrl}\n\nThis link expires for your security.`,
  };
}

export function contactEmail(input: {
  name: string;
  email: string;
  message: string;
}): EmailTemplate {
  return {
    subject: `UNK AI contact message from ${input.name}`,
    html: layout({
      preview: "A new message was submitted through UNK AI.",
      heading: "New contact message",
      body: `<p style="margin:0 0 8px"><strong>From:</strong> ${escapeHtml(input.name)}</p>
        <p style="margin:0 0 24px"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <div style="white-space:pre-wrap;background:#f3f7fb;border-radius:12px;padding:18px">${escapeHtml(input.message)}</div>`,
    }),
    text: `From: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
  };
}

export function bookingConfirmationEmail(input: {
  subject: string;
  body: string;
  confirmationId: string;
}): EmailTemplate {
  return {
    subject: input.subject,
    html: layout({
      preview: "Your UNK AI booking confirmation.",
      heading: "Booking confirmed",
      body: `<div style="white-space:pre-wrap">${escapeHtml(input.body)}</div>
        <p style="margin:24px 0 0"><strong>Confirmation ID:</strong> ${escapeHtml(input.confirmationId)}</p>`,
    }),
    text: `${input.body}\n\nConfirmation ID: ${input.confirmationId}`,
  };
}

