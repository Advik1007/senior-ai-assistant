"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OnboardingLink,
  OnboardingShell,
  OnboardingStatus,
  onboardingInputClass,
  onboardingLabelClass,
} from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { applyAuthToProfile, authErrorMessage, type AuthUser } from "@/lib/auth/client";
import { clearLanguageChoice } from "@/lib/storage/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTO_DELAY_MS = 800;

export default function SignupPage() {
  const router = useRouter();
  const { strings, lang, profile, setProfile, prefs, setPrefs } = useApp();
  const [name, setName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const attemptRef = useRef("");

  const submit = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const attemptKey = `${trimmedName}:${trimmedEmail}:${password}:${confirmPassword}`;
    if (attemptRef.current === attemptKey) return;

    if (!trimmedName || trimmedName.length < 2) return;
    if (!EMAIL_PATTERN.test(trimmedEmail)) return;
    if (password.length < 8) return;
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
        attemptRef.current = "";
        setError(authErrorMessage(data.message, strings));
        return;
      }

      attemptRef.current = attemptKey;
      const next = applyAuthToProfile(data.user, profile, prefs);
      setProfile(next.profile);
      setPrefs(next.prefs);
      router.push("/setup/contacts");
    } catch {
      attemptRef.current = "";
      setError(strings.authErrorGeneric);
    } finally {
      setLoading(false);
    }
  }, [
    confirmPassword,
    email,
    lang,
    name,
    password,
    prefs,
    profile,
    router,
    setPrefs,
    setProfile,
    strings,
  ]);

  useEffect(() => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (
      trimmedName.length < 2 ||
      !EMAIL_PATTERN.test(trimmedEmail) ||
      password.length < 8 ||
      confirmPassword.length < 8
    ) {
      attemptRef.current = "";
      return;
    }

    const timer = window.setTimeout(() => {
      void submit();
    }, AUTO_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [name, email, password, confirmPassword, submit]);

  return (
    <OnboardingShell
      lang={lang}
      title={strings.authSignup}
      subtitle={strings.authCreateAccount}
      footer={
        <div className="flex flex-col gap-2 text-[#5a6f85]">
          <OnboardingLink href="/auth/login">{strings.authHasAccount}</OnboardingLink>
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
            attemptRef.current = "";
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
            attemptRef.current = "";
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
            attemptRef.current = "";
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
            attemptRef.current = "";
            setError("");
          }}
          className={onboardingInputClass}
        />
      </div>
      {loading ? (
        <OnboardingStatus tone="loading">{strings.authCreatingAccount}</OnboardingStatus>
      ) : null}
      {error ? <OnboardingStatus tone="error">{error}</OnboardingStatus> : null}
    </OnboardingShell>
  );
}
