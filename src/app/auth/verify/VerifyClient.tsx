"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  OnboardingLink,
  OnboardingShell,
  OnboardingStatus,
} from "@/components/OnboardingShell";
import { useApp } from "@/components/providers/app-provider";
import { isAppLanguage } from "@/lib/languages";
import { markEmailVerified, nextPathAfterVerify } from "@/lib/storage/onboarding";

export default function VerifyClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { strings, lang, completeLogin } = useApp();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    verifiedRef.current = true;
    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: {
        ok?: boolean;
        email?: string;
        lang?: string;
        user?: { id: string; email: string; name: string; lang: string };
      }) => {
        if (!data.ok || !data.email) {
          setStatus("error");
          return;
        }
        if (data.user && isAppLanguage(data.user.lang)) {
          completeLogin({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            lang: data.user.lang,
          });
        } else {
          markEmailVerified();
        }
        setStatus("ok");
        window.setTimeout(
          () => window.location.assign(nextPathAfterVerify()),
          1200,
        );
      })
      .catch(() => setStatus("error"));
  }, [params, router, completeLogin]);

  return (
    <OnboardingShell
      lang={lang}
      title={
        status === "ok"
          ? strings.authVerifySuccess
          : status === "error"
            ? strings.authErrorTokenInvalid
            : strings.loading
      }
      footer={
        status === "error" ? (
          <OnboardingLink href="/auth/login">{strings.authLogin}</OnboardingLink>
        ) : null
      }
    >
      {status === "loading" ? (
        <OnboardingStatus tone="loading">{strings.loading}</OnboardingStatus>
      ) : null}
      {status === "ok" ? (
        <OnboardingStatus tone="success">{strings.authVerifySuccess}</OnboardingStatus>
      ) : null}
    </OnboardingShell>
  );
}
