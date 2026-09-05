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
import { clearLanguageChoice } from "@/lib/storage/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmailInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/@gamil\.com$/i, "@gmail.com")
    .replace(/@gmial\.com$/i, "@gmail.com")
    .replace(/@yaho\.com$/i, "@yahoo.com")
    .replace(/@hotnail\.com$/i, "@hotmail.com");
}

export default function SignupPage() {
  const router = useRouter();
  const { strings, lang, profile, setProfile, prefs, setPrefs, completeLogin } =
    useApp();
  const [name, setName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createAccount() {
    const trimmedName = name.trim();
    const trimmedEmail = normalizeEmailInput(email);
    if (trimmedEmail !== email.trim().toLowerCase()) {
      setEmail(trimmedEmail);
    }

    if (!trimmedName || trimmedName.length < 2) {
      setError(strings.authErrorNameRequired);
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(strings.authErrorInvalidEmail);
      return;
    }
    if (password.length < 8) {
      setError(strings.authErrorPasswordShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(strings.authErrorPasswordMismatch);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
          confirmPassword,
          lang,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        user?: AuthUser;
      };

      if (!res.ok || !data.user) {
        setError(authErrorMessage(data.message, strings));
        return;
      }

      completeLogin({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        lang: data.user.lang,
      });
      const next = applyAuthToProfile(data.user, profile, prefs);
      setProfile(next.profile);
      setPrefs(next.prefs);
      window.location.assign("/setup/contacts");
    } catch {
      setError(strings.authErrorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell
      lang={lang}
      title={strings.authSignup}
      subtitle={strings.authCreateAccount}
      footer={
        <div className="flex flex-col gap-3">
          <p className={onboardingMutedTextClass}>{strings.authHasAccount}</p>
          <BigButton href="/auth/login" tone="primary" className="text-xl">
            {strings.authLoginButton}
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
        <Label htmlFor="name" className={onboardingLabelClass}>
          {strings.authFullName}
        </Label>
        <Input
          id="name"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          className={onboardingInputClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className={onboardingLabelClass}>
          {strings.authEmail}
        </Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          className={onboardingInputClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm" className={onboardingLabelClass}>
          {strings.authConfirmPassword}
        </Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          className={onboardingInputClass}
        />
      </div>

      <BigButton
        tone="call"
        disabled={loading}
        onClick={() => void createAccount()}
      >
        {loading ? strings.authCreatingAccount : strings.authSignupButton}
      </BigButton>

      {error ? <OnboardingStatus tone="error">{error}</OnboardingStatus> : null}
    </OnboardingShell>
  );
}
