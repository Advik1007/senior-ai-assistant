"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { ApkDownloadButton } from "@/components/ApkDownloadButton";
import { nativeLaunchPath } from "@/lib/onboarding/decide-route";
import { readCachedSessionUser } from "@/lib/auth/client-session";
import { getOnboardingSnapshot } from "@/lib/storage/onboarding";

function isNativeAppShell(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // ignore
  }
  if (typeof window === "undefined") return false;
  const win = window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
    androidBridge?: unknown;
  };
  return Boolean(win.androidBridge || win.Capacitor?.isNativePlatform?.());
}

/**
 * Public UNK AI marketing site — kept light for phones (no slideshow / Ken Burns).
 * Native Android app skips this and continues into the real app (home / auth / start).
 */
export default function WebsitePage() {
  const router = useRouter();
  const [nativeBoot, setNativeBoot] = useState(false);

  useEffect(() => {
    if (!isNativeAppShell()) return;
    setNativeBoot(true);
    const state = getOnboardingSnapshot();
    const cached = readCachedSessionUser();
    const dest = nativeLaunchPath({
      authStatus: cached ? "authenticated" : "loading",
      languageChosen: state.languageChosen,
      setupWizardComplete: state.setupWizardComplete,
      sessionSetupCompleted: Boolean(cached?.setupCompleted),
      setupStep: state.setupStep || "contacts",
      flowFloor: state.flowFloor || "language",
    });
    router.replace(dest);
  }, [router]);

  // Avoid leaving the public marketing homepage on screen inside the APK.
  if (nativeBoot) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#0B1F3A] text-lg font-semibold text-white">
        UNK AI
      </main>
    );
  }

  return (
    <main className="site bg-[#F7F4EE] text-[#0B1F3A]">
      {/* —— HERO —— */}
      <section className="relative isolate flex min-h-[100svh] flex-col justify-end">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          {/* One static image — no crossfade slideshow (was causing lag on phones). */}
          <img
            src="/landing/hero-lite.jpg"
            alt=""
            width={1600}
            height={900}
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover object-[center_30%] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041018]/95 via-[#0B1F3A]/55 to-[#0B1F3A]/25" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))] sm:px-8 sm:pb-20 md:px-12 lg:px-16">
          <p className="site-brand text-[clamp(3.5rem,14vw,7rem)] font-bold leading-none tracking-[0.12em] text-white">
            UNK
          </p>
          <p className="site-brand mt-1 text-[clamp(1.75rem,6vw,3rem)] font-bold leading-none tracking-[0.14em] text-[#F4B400] sm:mt-2">
            UNK AI
          </p>

          <h1 className="site-display mt-6 max-w-3xl text-[clamp(1.6rem,5.2vw,3.15rem)] font-semibold leading-[1.18] text-white sm:mt-8">
            The Right Place For All Solutions For the Elderly
          </h1>

          <p className="mt-4 max-w-2xl text-[clamp(1.05rem,2.8vw,1.35rem)] leading-relaxed text-white/90 sm:mt-5">
            A calm Android companion — voice help, family calls, reminders, and
            everyday care — designed so technology finally feels simple.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:max-w-xl sm:flex-row sm:items-stretch md:max-w-none">
            <a
              href="#motive"
              className="site-cta inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-[#F4B400] px-6 text-base font-bold text-[#0B1F3A] transition hover:brightness-105 sm:min-h-16 sm:px-7 sm:text-lg"
            >
              Our motive
            </a>
            <a
              href="#download"
              className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl border-2 border-white/70 bg-white/15 px-6 text-base font-semibold text-white transition hover:bg-white/25 sm:min-h-16 sm:px-7 sm:text-lg"
            >
              Get the app
            </a>
          </div>
        </div>
      </section>

      {/* —— MOTIVE —— */}
      <section id="motive" className="relative scroll-mt-2">
        <div className="grid md:grid-cols-2 md:min-h-[min(70vh,44rem)] lg:min-h-[70vh]">
          <div className="relative min-h-[38vh] sm:min-h-[44vh] md:min-h-full">
            <img
              src="/landing/motive-lite.jpg"
              alt="An adult helping an older parent with a phone"
              width={1400}
              height={900}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover object-[center_25%] md:object-center"
            />
            <div className="absolute inset-0 bg-[#0B1F3A]/15" />
          </div>

          <div className="flex flex-col justify-center bg-[#0B1F3A] px-4 py-12 text-[#F7FBFF] sm:px-8 sm:py-16 md:px-10 lg:px-16">
            <p className="text-xs font-semibold tracking-[0.28em] text-[#F4B400] uppercase sm:text-sm">
              Our motive
            </p>
            <h2 className="site-display mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight">
              Why this app is made
            </h2>
            <div className="mt-5 max-w-prose space-y-4 text-[clamp(1.05rem,2.4vw,1.25rem)] leading-relaxed text-[#D7E8F7] sm:mt-6 sm:space-y-5">
              <p>
                Most apps are built for fast thumbs and perfect eyesight. Our
                elders are left squinting at tiny menus, forgotten passwords, and
                screens that feel unkind.
              </p>
              <p>
                UNK AI was made so older adults — and the families who love them —
                have one respectful place for everyday solutions: talk by voice,
                reach family in a tap, keep medicines and routines clear, and ask
                for help without fear of doing it “wrong.”
              </p>
              <p>
                Inclusive by Design is not a slogan for us. It is the reason UNK
                AI exists — large text, plain language, fewer steps, and safety
                built in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* —— PROMISE STRIP —— */}
      <section className="border-y border-[#0B1F3A]/10 bg-[#F7F4EE] px-4 py-12 sm:px-8 sm:py-14 md:px-12 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-8 sm:gap-10 md:grid-cols-3">
          {[
            {
              title: "Voice first",
              body: "Speak naturally. Less typing, less stress.",
            },
            {
              title: "Family close",
              body: "Call the people who matter in one clear tap.",
            },
            {
              title: "Daily care",
              body: "Reminders, routine, and medicines — kept simple.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border-b border-[#0B1F3A]/10 pb-6 last:border-b-0 md:border-b-0 md:pb-0"
            >
              <h3 className="site-display text-xl font-semibold text-[#0B1F3A] sm:text-2xl">
                {item.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-[#3D4F63] sm:text-lg">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* —— DOWNLOAD —— */}
      <section
        id="download"
        className="relative scroll-mt-2 bg-[#F7F4EE] px-4 py-16 sm:px-8 sm:py-20 md:px-12 md:py-24 lg:px-16"
      >
        <div className="mx-auto w-full max-w-xl md:max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.28em] text-[#0B4F8A] uppercase sm:text-sm">
            Get the app
          </p>
          <h2 className="site-display mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight text-[#0B1F3A]">
            Get the app on Android
          </h2>
          <p className="mt-4 text-[clamp(1.05rem,2.4vw,1.25rem)] leading-relaxed text-[#3D4F63]">
            Install on your phone. Large buttons. Clear steps. Built for seniors.
          </p>

          <div className="mt-8 sm:mt-10">
            <ApkDownloadButton
              className="max-w-none"
              label="Download for Android"
            />
          </div>

          <p className="mt-8 text-sm text-[#5A6B7D] sm:mt-10 sm:text-base">
            Prefer to try in the browser first?{" "}
            <Link
              href="/start"
              className="font-semibold text-[#0B4F8A] underline-offset-4 hover:underline"
            >
              Open the web app
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-[#0B1F3A]/10 bg-[#0B1F3A] px-4 py-8 text-center text-sm text-[#A8C4DC] sm:px-8 sm:py-10 sm:text-base">
        <p className="site-brand text-lg tracking-[0.12em] text-white sm:text-xl">
          UNK AI
        </p>
        <p className="mx-auto mt-2 max-w-md px-2">
          The right place for all solutions for the elderly.
        </p>
        <p className="mt-4 text-xs text-[#7A9BB8] sm:text-sm">
          © {new Date().getFullYear()} UNK AI — Inclusive by Design.
        </p>
      </footer>

      <style jsx>{`
        .site {
          font-family: "Atkinson Hyperlegible", "Segoe UI", sans-serif;
          min-height: 100svh;
        }
        .site-brand,
        .site-display {
          font-family: Georgia, "Times New Roman", serif;
        }
        .site-cta {
          box-shadow: 0 10px 24px rgba(244, 180, 0, 0.22);
        }
      `}</style>
    </main>
  );
}
