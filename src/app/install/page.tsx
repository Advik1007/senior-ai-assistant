"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UnkLogo } from "@/components/UnkLogo";

const APK_HREF = "/downloads/unk-ai.apk";

/** Public install landing — no login required. */
export default function InstallPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <main className="install-page relative min-h-dvh overflow-hidden text-[#F7FBFF]">
      <div className="install-sky" aria-hidden />
      <div className="install-orb install-orb-a" aria-hidden />
      <div className="install-orb install-orb-b" aria-hidden />
      <div className="install-grid" aria-hidden />

      <div
        className={`relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16 transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="mb-6 flex items-center gap-4">
          <UnkLogo className="size-20 shrink-0 sm:size-24" />
          <p className="install-brand text-5xl font-bold tracking-[0.08em] sm:text-7xl">
            UNK AI
          </p>
        </div>

        <h1 className="install-headline max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
          Built so older adults can get help with one tap.
        </h1>

        <p className="mt-5 max-w-xl text-xl leading-relaxed text-[#D7E8F7]">
          Our motive is simple: make daily life easier for seniors — call family
          safely, talk by voice, set reminders, and find everyday help — with
          large buttons, clear words, and no confusing steps.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a
            href={APK_HREF}
            download="unk-ai.apk"
            className="install-cta inline-flex min-h-16 items-center justify-center rounded-2xl bg-[#F4B400] px-8 text-2xl font-bold text-[#0B1F3A] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Install here
          </a>
          <Link
            href="/"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-white/40 px-6 text-xl font-semibold text-white/95 transition-colors hover:bg-white/10"
          >
            Open website
          </Link>
        </div>

        <ol className="mt-14 max-w-xl space-y-3 text-lg text-[#D7E8F7]">
          <li>
            1. Tap <strong className="text-white">Install here</strong>
          </li>
          <li>2. Open the downloaded file on your phone</li>
          <li>3. Allow install if Android asks</li>
        </ol>
      </div>

      <style jsx>{`
        .install-page {
          font-family: "Atkinson Hyperlegible", "Segoe UI", sans-serif;
          background: #062844;
        }
        .install-brand {
          font-family: Georgia, "Times New Roman", serif;
          letter-spacing: 0.06em;
        }
        .install-headline {
          font-family: Georgia, "Times New Roman", serif;
        }
        .install-sky {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(120% 80% at 10% 0%, #1a6fb0 0%, transparent 55%),
            radial-gradient(90% 70% at 100% 100%, #0a3a66 0%, transparent 50%),
            linear-gradient(165deg, #0b4f8a 0%, #062844 55%, #041828 100%);
          animation: install-sky-shift 14s ease-in-out infinite alternate;
        }
        .install-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(2px);
          opacity: 0.35;
        }
        .install-orb-a {
          width: 18rem;
          height: 18rem;
          top: 12%;
          right: -4rem;
          background: #7ec8ff;
          animation: install-float 9s ease-in-out infinite;
        }
        .install-orb-b {
          width: 12rem;
          height: 12rem;
          bottom: 10%;
          left: -3rem;
          background: #f4b400;
          opacity: 0.22;
          animation: install-float 11s ease-in-out infinite reverse;
        }
        .install-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
          mask-image: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.45),
            transparent 80%
          );
          pointer-events: none;
        }
        .install-cta {
          box-shadow: 0 12px 32px rgba(244, 180, 0, 0.28);
          animation: install-cta-in 0.9s ease-out 0.25s both;
        }
        @keyframes install-sky-shift {
          from {
            filter: saturate(1);
          }
          to {
            filter: saturate(1.15) brightness(1.05);
          }
        }
        @keyframes install-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-18px);
          }
        }
        @keyframes install-cta-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
