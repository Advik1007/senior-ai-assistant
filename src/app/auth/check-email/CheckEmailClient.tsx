"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  OnboardingLink,
  OnboardingShell,
  OnboardingStatus,
  onboardingMutedTextClass,
} from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { authErrorMessage } from "@/lib/auth/client";

export default function CheckEmailClient() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const { strings, lang } = useApp();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function resend() {
    if (!email || resending) return;
    setResending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(authErrorMessage(data.message, strings));
        return;
      }
      setMessage(strings.authVerifyResent);
    } catch {
      setError(strings.authErrorGeneric);
    } finally {
      setResending(false);
    }
  }

  return (
    <OnboardingShell
      lang={lang}
      title={strings.authVerifyTitle}
      subtitle={strings.authVerifyBody}
      footer={
        <OnboardingLink href="/auth/login">{strings.back}</OnboardingLink>
      }
    >
      {email ? (
        <p className="rounded-xl border-2 border-[#0B1F3A]/10 bg-[#f7f9fb] px-5 py-4 text-xl text-[#0B1F3A] break-all">
          {email}
        </p>
      ) : null}
      <OnboardingStatus tone="success">{strings.authVerifyResent}</OnboardingStatus>
      <p className={onboardingMutedTextClass}>{strings.authVerifyPending}</p>
      {message ? <OnboardingStatus tone="success">{message}</OnboardingStatus> : null}
      {error ? <OnboardingStatus tone="error">{error}</OnboardingStatus> : null}
      {email ? (
        <p className={`text-center ${onboardingMutedTextClass}`}>
          <OnboardingLink onClick={() => void resend()}>
            {resending ? strings.authSendingEmailLink : strings.authVerifyResend}
          </OnboardingLink>
        </p>
      ) : null}
    </OnboardingShell>
  );
}
