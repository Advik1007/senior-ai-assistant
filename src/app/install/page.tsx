"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UnkLogo } from "@/components/UnkLogo";

const APK_HREF = "/downloads/unk-ai.apk";

/** Public UNK AI landing — brand, who we are, download. No login. */
export default function InstallPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <main className="landing relative min-h-svh overflow-x-hidden text-[#F7FBFF]">
      <div className="landing-sky" aria-hidden />
      <div className="landing-orb landing-orb-a" aria-hidden />
      <div className="landing-orb landing-orb-b" aria-hidden />

      {/* Hero — brand first */}
      <section
        className={`relative z-10 mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-16 transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="mb-8 flex items-center gap-4">
          <UnkLogo className="size-20 shrink-0 sm:size-24" />
          <h1 className="landing-brand text-5xl font-bold tracking-[0.08em] sm:text-7xl">
            UNK AI
          </h1>
        </div>

        <p className="landing-headline max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
          Help for everyday life — one tap away.
        </p>

        <p className="mt-5 max-w-xl text-xl leading-relaxed text-[#D7E8F7]">
          A simple Android companion for older adults: call family, talk by
          voice, set reminders, and get everyday help — with large buttons and
          clear words.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a
            href={APK_HREF}
            download="unk-ai.apk"
            type="application/vnd.android.package-archive"
            className="landing-cta inline-flex min-h-16 items-center justify-center rounded-2xl bg-[#F4B400] px-8 text-2xl font-bold text-[#0B1F3A] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Download us here
          </a>
          <a
            href="#who-we-are"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-white/40 px-6 text-xl font-semibold text-white/95 transition-colors hover:bg-white/10"
          >
            Who we are
          </a>
        </div>
      </section>

      {/* Who we are */}
      <section
        id="who-we-are"
        className="relative z-10 border-t border-white/15 bg-[#041828]/55 px-6 py-20 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.25em] text-[#F4B400] uppercase">
            Who we are
          </p>
          <h2 className="landing-headline mt-3 text-3xl font-semibold sm:text-4xl">
            We built UNK AI for our elders.
          </h2>
          <div className="mt-6 space-y-5 text-xl leading-relaxed text-[#D7E8F7]">
            <p>
              We are a small team making technology that feels calm, respectful,
              and easy — especially for seniors who find most apps confusing.
            </p>
            <p>
              UNK AI is not a chat toy. It is a practical helper: speak to get
              things done, reach family quickly, keep medicines and routines in
              one place, and ask for help without tiny menus.
            </p>
            <p>
              Our promise is clarity — large text, plain language, and fewer
              steps — so getting help never feels harder than it should.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Voice first", body: "Talk instead of typing." },
              { title: "Family close", body: "Call loved ones in one tap." },
              { title: "Daily care", body: "Reminders, routine, medicines." },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-white/20 bg-white/5 px-5 py-5"
              >
                <p className="text-xl font-bold text-white">{item.title}</p>
                <p className="mt-2 text-lg text-[#C5D9EB]">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Download again */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="landing-headline text-3xl font-semibold sm:text-4xl">
            Get UNK AI on Android
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xl text-[#D7E8F7]">
            Download the app file, open it on your phone, and allow install if
            Android asks.
          </p>
          <a
            href={APK_HREF}
            download="unk-ai.apk"
            type="application/vnd.android.package-archive"
            className="landing-cta mt-10 inline-flex min-h-16 items-center justify-center rounded-2xl bg-[#F4B400] px-10 text-2xl font-bold text-[#0B1F3A] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Download us here
          </a>
          <ol className="mx-auto mt-12 max-w-md space-y-3 text-left text-lg text-[#D7E8F7]">
            <li>
              1. Tap <strong className="text-white">Download us here</strong>
            </li>
            <li>
              2. Open <strong className="text-white">unk-ai.apk</strong>
            </li>
            <li>3. Allow install if Android asks</li>
          </ol>
          <p className="mt-10 text-base text-[#A8C4DC]">
            Already using the web version?{" "}
            <Link href="/" className="font-semibold text-white underline-offset-4 hover:underline">
              Open UNK AI online
            </Link>
          </p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-base text-[#8AA8C2]">
        © {new Date().getFullYear()} UNK AI — built for seniors, with care.
      </footer>

      <style jsx>{`
        .landing {
          font-family: "Atkinson Hyperlegible", "Segoe UI", sans-serif;
          background: #062844;
        }
        .landing-brand {
          font-family: Georgia, "Times New Roman", serif;
          letter-spacing: 0.06em;
        }
        .landing-headline {
          font-family: Georgia, "Times New Roman", serif;
        }
        .landing-sky {
          position: fixed;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(120% 80% at 10% 0%, #1a6fb0 0%, transparent 55%),
            radial-gradient(90% 70% at 100% 100%, #0a3a66 0%, transparent 50%),
            linear-gradient(165deg, #0b4f8a 0%, #062844 55%, #041828 100%);
          animation: landing-sky 14s ease-in-out infinite alternate;
        }
        .landing-orb {
          position: fixed;
          z-index: 0;
          border-radius: 999px;
          filter: blur(2px);
          opacity: 0.35;
          pointer-events: none;
        }
        .landing-orb-a {
          width: 18rem;
          height: 18rem;
          top: 12%;
          right: -4rem;
          background: #7ec8ff;
          animation: landing-float 9s ease-in-out infinite;
        }
        .landing-orb-b {
          width: 12rem;
          height: 12rem;
          bottom: 18%;
          left: -3rem;
          background: #f4b400;
          opacity: 0.22;
          animation: landing-float 11s ease-in-out infinite reverse;
        }
        .landing-cta {
          box-shadow: 0 12px 32px rgba(244, 180, 0, 0.28);
        }
        @keyframes landing-sky {
          from {
            filter: saturate(1);
          }
          to {
            filter: saturate(1.12) brightness(1.04);
          }
        }
        @keyframes landing-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-18px);
          }
        }
      `}</style>
    </main>
  );
}
