"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OnboardingLink,
  OnboardingShell,
  OnboardingStatus,
  onboardingInputClass,
  onboardingLabelClass,
  onboardingMutedTextClass,
} from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { authErrorMessage } from "@/lib/auth/client";
import { clearLanguageChoice } from "@/lib/storage/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTO_DELAY_MS = 800;

type EmailStatus = "idle" | "waiting" | "sending" | "sent" | "error";

export default function LoginPage() {
  const router = useRouter();
  const { strings, lang, profile, setProfile } = useApp();
  const [email, setEmail] = useState(profile.email);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [error, setError] = useState("");
  const sentEmailRef = useRef("");

  const sendConfirmationEmail = useCallback(
    async (trimmed: string) => {
      if (sentEmailRef.current === trimmed) return;

      setEmailStatus("sending");
      setError("");
      try {
        const res = await fetch("/api/auth/send-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, lang }),
        });

        const data = (await res.json().catch(() => ({}))) as { message?: string };

        if (!res.ok) {
          setEmailStatus("error");
          setError(authErrorMessage(data.message, strings));
          return;
        }

        sentEmailRef.current = trimmed;
        setProfile({ ...profile, email: trimmed });
        setEmailStatus("sent");
        router.push(`/auth/check-email?email=${encodeURIComponent(trimmed)}`);
      } catch {
        setEmailStatus("error");
        setError(strings.authErrorGeneric);
      }
    },
    [lang, profile, router, setProfile, strings],
  );

  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailStatus("idle");
      sentEmailRef.current = "";
      return;
    }

    if (sentEmailRef.current === trimmed) {
      setEmailStatus("sent");
      return;
    }

    setEmailStatus("waiting");
    const timer = window.setTimeout(() => {
      void sendConfirmationEmail(trimmed);
    }, AUTO_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [email, sendConfirmationEmail]);

  const steps = strings.authLoginSteps.split("\n");

  return (
    <OnboardingShell
      lang={lang}
      title={strings.authLogin}
      subtitle={strings.authLoginSafetyHint}
      footer={
        <OnboardingLink
          onClick={() => {
            clearLanguageChoice();
            router.push("/");
          }}
        >
          {strings.authChangeLanguage}
        </OnboardingLink>
      }
    >
      <ol className={`m-0 list-decimal space-y-2 pl-6 ${onboardingMutedTextClass}`}>
        {steps.map((step) => (
          <li key={step}>{step.replace(/^\d+\.\s*/, "")}</li>
        ))}
      </ol>

      <div className="space-y-2">
        <Label htmlFor="email" className={onboardingLabelClass}>
          {strings.authEmail}
        </Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            sentEmailRef.current = "";
            setError("");
          }}
          className={onboardingInputClass}
        />
      </div>

      {emailStatus === "waiting" || emailStatus === "sending" ? (
        <OnboardingStatus tone="loading">{strings.authSendingEmailLink}</OnboardingStatus>
      ) : null}
      {emailStatus === "sent" ? (
        <OnboardingStatus tone="success">{strings.authVerifyResent}</OnboardingStatus>
      ) : null}
      {error ? <OnboardingStatus tone="error">{error}</OnboardingStatus> : null}
    </OnboardingShell>
  );
}
