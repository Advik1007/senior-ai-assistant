import Link from "next/link";
import type { AppLanguage } from "@/lib/languages";
import { languageByCode } from "@/lib/languages";
import { deviceLoginCopy } from "@/lib/email/device-login-i18n";

export function DeviceLoginResult({
  variant,
  lang,
  userName,
  message,
}: {
  variant: "approve" | "deny" | "error" | "used";
  lang: AppLanguage;
  userName?: string;
  message?: string;
}) {
  const copy = deviceLoginCopy(lang);
  const meta = languageByCode(lang);
  const dir = meta.rtl ? "rtl" : "ltr";

  const heading =
    variant === "approve"
      ? copy.approveHeading(userName || "")
      : variant === "deny"
        ? copy.denyHeading
        : variant === "used"
          ? copy.alreadyUsed
          : copy.invalidToken;

  const body =
    variant === "approve"
      ? copy.approveBody
      : variant === "deny"
        ? copy.denyBody
        : message || copy.invalidToken;

  const subtext = variant === "approve" ? copy.approveSubtext : undefined;

  const buttonLabel =
    variant === "approve"
      ? copy.continueButton
      : variant === "deny"
        ? copy.reviewSecurityButton
        : copy.continueButton;

  const buttonHref = variant === "deny" ? "/settings" : "/home";

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10"
      dir={dir}
      lang={meta.htmlLang}
    >
      <div className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0B4F8A]">
          UNK AI
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[#0B1F3A]">
          {heading}
        </h1>
        {subtext ? (
          <p className="mt-4 text-xl font-semibold text-[#0B4F8A]">{body}</p>
        ) : (
          <p className="mt-4 text-xl leading-relaxed text-[#29445e]">{body}</p>
        )}
        {subtext ? (
          <p className="mt-3 text-lg text-[#29445e]">{subtext}</p>
        ) : null}
        {variant === "error" || variant === "used" ? null : (
          <Link
            href={buttonHref}
            className="mt-8 inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-[#0B4F8A] px-6 text-xl font-bold text-white"
          >
            {buttonLabel}
          </Link>
        )}
        {variant === "error" || variant === "used" ? (
          <Link
            href="/home"
            className="mt-8 inline-flex min-h-16 w-full items-center justify-center rounded-2xl border-4 border-[#0B1F3A] bg-white px-6 text-xl font-bold text-[#0B1F3A]"
          >
            {copy.continueButton}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
