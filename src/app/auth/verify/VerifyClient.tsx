"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import {
  OnboardingLink,
  OnboardingShell,
  OnboardingStatus,
} from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { toAndroidIntentUrl, toAppDeepLink } from "@/lib/deep-link";
import { isAppLanguage } from "@/lib/languages";
import {
  markEmailVerified,
  markEnteredSetupFlow,
  nextPathAfterVerify,
} from "@/lib/storage/onboarding";

/**
 * Safety-check landing page.
 * In a phone browser: hand off to the UNK AI app so the session stays in-app.
 * Inside the Capacitor app: verify the token and continue to setup/home.
 */
export default function VerifyClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { strings, lang, completeLogin } = useApp();
  const [status, setStatus] = useState<"handoff" | "loading" | "ok" | "error">(
    "loading",
  );
  const verifiedRef = useRef(false);
  const token = params.get("token");

  // Browser → try open the Android app with the same token (do not verify only on web).
  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    if (Capacitor.isNativePlatform()) return;

    const path = `/auth/verify?token=${encodeURIComponent(token)}`;
    const httpsUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    const deep = toAppDeepLink(path);
    const intent = toAndroidIntentUrl(httpsUrl, path.slice(1));

    setStatus("handoff");
    // Prefer Android Intent (opens app or falls back); also try custom scheme.
    window.location.href = /Android/i.test(navigator.userAgent) ? intent : deep;

    const t = window.setTimeout(() => {
      // Still here → app not installed or blocked; verify on web as fallback.
      void runVerify();
    }, 1800);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function runVerify() {
    if (verifiedRef.current || !token) return;
    verifiedRef.current = true;
    setStatus("loading");

    try {
      const res = await fetch(
        `/api/auth/verify?token=${encodeURIComponent(token)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        email?: string;
        token?: string;
        user?: {
          id: string;
          email: string;
          name: string;
          lang: string;
          setupCompleted?: boolean;
        };
      };

      if (!data.ok || !data.email) {
        setStatus("error");
        return;
      }

      if (data.user && isAppLanguage(data.user.lang)) {
        completeLogin(
          {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            lang: data.user.lang,
            setupCompleted: Boolean(data.user.setupCompleted),
          },
          data.token,
        );
        if (!data.user.setupCompleted) {
          markEnteredSetupFlow();
        }
      } else {
        markEmailVerified();
        markEnteredSetupFlow();
      }
      setStatus("ok");
      window.setTimeout(() => router.replace(nextPathAfterVerify()), 800);
    } catch {
      setStatus("error");
    }
  }

  // Native app: verify immediately.
  useEffect(() => {
    if (!token) return;
    if (!Capacitor.isNativePlatform()) return;
    void runVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const path = token
    ? `/auth/verify?token=${encodeURIComponent(token)}`
    : "/auth/verify";
  const openAppHref =
    typeof window !== "undefined"
      ? toAndroidIntentUrl(`${window.location.origin}${path}`, path.slice(1))
      : toAppDeepLink(path);

  return (
    <OnboardingShell
      lang={lang}
      title={
        status === "ok"
          ? strings.authVerifySuccess
          : status === "error"
            ? strings.authErrorTokenInvalid
            : status === "handoff"
              ? "Opening UNK AI…"
              : strings.loading
      }
      footer={
        status === "error" ? (
          <OnboardingLink href="/auth/login">{strings.authLogin}</OnboardingLink>
        ) : status === "handoff" ? (
          <div className="flex flex-col gap-3">
            <a
              href={openAppHref}
              className="text-lg font-medium text-[#0B4F8A] underline-offset-4 hover:underline"
            >
              Open UNK AI app
            </a>
            <OnboardingLink
              onClick={() => {
                verifiedRef.current = false;
                void runVerify();
              }}
            >
              Continue in browser
            </OnboardingLink>
          </div>
        ) : null
      }
    >
      {status === "loading" || status === "handoff" ? (
        <OnboardingStatus tone="loading">
          {status === "handoff"
            ? "Opening the UNK AI app so you stay signed in there…"
            : strings.loading}
        </OnboardingStatus>
      ) : null}
      {status === "ok" ? (
        <OnboardingStatus tone="success">{strings.authVerifySuccess}</OnboardingStatus>
      ) : null}
    </OnboardingShell>
  );
}
