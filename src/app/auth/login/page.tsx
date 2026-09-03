"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import {
  OnboardingLink,
  OnboardingShell,
  OnboardingStatus,
  onboardingInputClass,
  onboardingLabelClass,
  onboardingMutedTextClass,
} from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import {
  applyAuthToProfile,
  authErrorMessage,
  type AuthUser,
} from "@/lib/auth/client";
import { applySessionToClient } from "@/lib/auth/client-session";
import { clearLanguageChoice, nextPathAfterVerify } from "@/lib/storage/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const { strings, lang, profile, setProfile, prefs, setPrefs } = useApp();
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailLinkLoading, setEmailLinkLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function signInWithPassword() {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError(strings.authErrorInvalidEmail);
      return;
    }
    if (!password) {
      setError(strings.authErrorInvalidCredentials);
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmed, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        user?: AuthUser;
      };

      if (!res.ok || !data.user) {
        setError(authErrorMessage(data.message, strings));
        return;
      }

      applySessionToClient({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        lang: data.user.lang,
      });
      const next = applyAuthToProfile(data.user, profile, prefs);
      setProfile(next.profile);
      setPrefs(next.prefs);
      router.push(nextPathAfterVerify());
    } catch {
      setError(strings.authErrorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function sendSafetyEmail() {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError(strings.authErrorInvalidEmail);
      return;
    }

    setEmailLinkLoading(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, lang }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(authErrorMessage(data.message, strings));
        return;
      }
      setProfile({ ...profile, email: trimmed });
      router.push(`/auth/check-email?email=${encodeURIComponent(trimmed)}`);
    } catch {
      setError(strings.authErrorGeneric);
    } finally {
      setEmailLinkLoading(false);
    }
  }

  return (
    <OnboardingShell
      lang={lang}
      title={strings.authLogin}
      subtitle={strings.authLoginSafetyHint}
      footer={
        <div className="flex flex-col gap-3">
          <p className={onboardingMutedTextClass}>{strings.authNoAccount}</p>
          <BigButton href="/auth/signup" tone="call" className="text-xl">
            {strings.authCreateAccount}
          </BigButton>
          <OnboardingLink
            onClick={() => {
              clearLanguageChoice();
              router.push("/");
            }}
          >
            {strings.authChangeLanguage}
          </OnboardingLink>
        </div>
      }
    >
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
            setError("");
          }}
          className={onboardingInputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={onboardingLabelClass}>
          {strings.authPassword}
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          className={onboardingInputClass}
        />
      </div>

      <BigButton
        tone="primary"
        disabled={loading}
        onClick={() => void signInWithPassword()}
      >
        {loading ? strings.authLoggingIn : strings.authLoginButton}
      </BigButton>

      <BigButton
        tone="muted"
        disabled={emailLinkLoading}
        onClick={() => void sendSafetyEmail()}
      >
        {emailLinkLoading
          ? strings.authSendingEmailLink
          : strings.authEmailLinkButton}
      </BigButton>

      <BigButton href="/auth/signup" tone="call">
        {strings.authSignupButton}
      </BigButton>

      {info ? <OnboardingStatus tone="success">{info}</OnboardingStatus> : null}
      {error ? <OnboardingStatus tone="error">{error}</OnboardingStatus> : null}
    </OnboardingShell>
  );
}
