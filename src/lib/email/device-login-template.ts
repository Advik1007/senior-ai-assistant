import type { AppLanguage } from "@/lib/languages";
import { languageByCode } from "@/lib/languages";
import { deviceLoginCopy } from "@/lib/email/device-login-i18n";
import type { DeviceLoginDetails } from "@/lib/email/device-login-tokens";
import type { EmailTemplate } from "@/lib/email/templates";

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

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;font-size:15px;color:#60758a;font-weight:700;width:38%">${escapeHtml(label)}</td>
    <td style="padding:10px 0;font-size:17px;color:#0b1f3a;font-weight:600">${escapeHtml(value)}</td>
  </tr>`;
}

export function newDeviceLoginEmail(input: {
  lang: AppLanguage;
  userName: string;
  details: DeviceLoginDetails;
  approveUrl: string;
  denyUrl: string;
}): EmailTemplate {
  const copy = deviceLoginCopy(input.lang);
  const meta = languageByCode(input.lang);
  const dir = meta.rtl ? "rtl" : "ltr";
  const align = meta.rtl ? "right" : "left";

  const html = `<!doctype html>
<html lang="${escapeHtml(meta.htmlLang)}" dir="${dir}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(copy.subject)}</title>
  </head>
  <body style="margin:0;background:#f3f7fb;color:#0b1f3a;font-family:Arial,Helvetica,sans-serif;direction:${dir}">
    <span style="display:none;max-height:0;overflow:hidden">${escapeHtml(copy.intro)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7fb;padding:24px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #d8e4ef;border-radius:20px;overflow:hidden">
            <tr>
              <td style="background:#0b1f3a;color:#fff;padding:28px 32px;text-align:${align}">
                <div style="font-size:28px;font-weight:800">${BRAND}</div>
                <div style="margin-top:6px;color:#cfe6fa;font-size:15px">${TAGLINE}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;text-align:${align}">
                <p style="margin:0 0 12px;font-size:20px;line-height:1.5;color:#0b1f3a;font-weight:700">${escapeHtml(copy.greeting(input.userName))}</p>
                <p style="margin:0 0 24px;font-size:18px;line-height:1.65;color:#29445e">${escapeHtml(copy.intro)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7fb;border:1px solid #d8e4ef;border-radius:16px;padding:8px 20px;margin:0 0 28px">
                  ${row(copy.deviceLabel, input.details.deviceName)}
                  ${row(copy.browserLabel, input.details.browser)}
                  ${row(copy.locationLabel, input.details.location)}
                  ${row(copy.timeLabel, input.details.time)}
                </table>
                <h2 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:#0b1f3a">${escapeHtml(copy.wasThisYou)}</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:0 0 12px">
                      <a href="${escapeHtml(input.approveUrl)}" style="display:block;background:#146c2e;color:#fff;text-decoration:none;font-weight:800;font-size:18px;padding:18px 20px;border-radius:14px;text-align:center">
                        ${escapeHtml(copy.yesButton)}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${escapeHtml(input.denyUrl)}" style="display:block;background:#b00020;color:#fff;text-decoration:none;font-weight:800;font-size:18px;padding:18px 20px;border-radius:14px;text-align:center">
                        ${escapeHtml(copy.noButton)}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;font-size:14px;line-height:1.55;color:#60758a">${escapeHtml(copy.footerNote)}</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e3ebf2;padding:20px 32px;font-size:13px;color:#60758a;text-align:${align}">
                ${BRAND} · ${TAGLINE}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${copy.greeting(input.userName)}

${copy.intro}

${copy.deviceLabel}: ${input.details.deviceName}
${copy.browserLabel}: ${input.details.browser}
${copy.locationLabel}: ${input.details.location}
${copy.timeLabel}: ${input.details.time}

${copy.wasThisYou}
${copy.yesButton}: ${input.approveUrl}
${copy.noButton}: ${input.denyUrl}

${copy.footerNote}`;

  return { subject: copy.subject, html, text };
}
