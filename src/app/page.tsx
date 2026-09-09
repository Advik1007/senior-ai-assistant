"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { ApkDownloadButton } from "@/components/ApkDownloadButton";
import { UnkLogo } from "@/components/UnkLogo";

const HERO_BACKDROPS = [
  "/landing/backdrop-elder-woman.png",
  "/landing/elder-smile.jpg",
  "/landing/backdrop-elder-man.png",
  "/landing/hero.jpg",
];

/**
 * Public UNK AI marketing website.
 * Native Android app skips this and continues to /start.
 */
export default function WebsitePage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      router.replace("/start");
      return;
    }
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [router]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const timer = window.setInterval(() => {
      setSlide((n) => (n + 1) % HERO_BACKDROPS.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="site min-h-svh overflow-x-hidden bg-[#F7F4EE] text-[#0B1F3A]">
      {/* —— HERO —— */}
      <section className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 -z-10" aria-hidden>
          {HERO_BACKDROPS.map((src, i) => (
            <div
              key={src}
              className={`site-backdrop absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms] ease-in-out ${
                i === slide ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#041018]/92 via-[#0B1F3A]/55 to-[#0B1F3A]/25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(11,79,138,0.35),transparent_55%)]" />
        </div>

        <div
          className={`relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 pt-24 transition-all duration-800 ease-out sm:pb-20 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="mb-8 flex items-center gap-4">
            <UnkLogo className="size-16 shrink-0 sm:size-20" />
            <p className="site-brand text-5xl font-bold tracking-[0.1em] text-white sm:text-7xl">
              UNK AI
            </p>
          </div>

          <h1 className="site-display max-w-3xl text-3xl font-semibold leading-[1.15] text-white sm:text-5xl">
            The Right Place For All Solutions For the Elderly
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            A calm Android companion — voice help, family calls, reminders, and
            everyday care — designed so technology finally feels simple.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#motive"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-white/70 bg-white/10 px-7 text-lg font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Our motive
            </a>
            <a
              href="#download"
              className="site-cta inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#F4B400] px-7 text-lg font-bold text-[#0B1F3A] transition hover:brightness-105"
            >
              Download UNK AI
            </a>
          </div>
        </div>
      </section>

      {/* —— MOTIVE —— */}
      <section id="motive" className="relative scroll-mt-4">
        <div className="grid min-h-[70vh] lg:grid-cols-2">
          <div
            className="relative min-h-[42vh] bg-cover bg-center lg:min-h-full"
            style={{
              backgroundImage: "url(/landing/motive-family.png)",
            }}
            role="img"
            aria-label="An adult helping an older parent with a phone"
          >
            <div className="absolute inset-0 bg-[#0B1F3A]/15" />
          </div>

          <div className="flex flex-col justify-center bg-[#0B1F3A] px-6 py-16 text-[#F7FBFF] sm:px-12 lg:px-16">
            <p className="text-sm font-semibold tracking-[0.28em] text-[#F4B400] uppercase">
              Our motive
            </p>
            <h2 className="site-display mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Why this app is made
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-[#D7E8F7] sm:text-xl">
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
      <section className="border-y border-[#0B1F3A]/10 bg-[#F7F4EE] px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
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
            <div key={item.title}>
              <h3 className="site-display text-2xl font-semibold text-[#0B1F3A]">
                {item.title}
              </h3>
              <p className="mt-2 text-lg leading-relaxed text-[#3D4F63]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* —— DOWNLOAD (appears after scrolling) —— */}
      <section
        id="download"
        className="relative scroll-mt-4 overflow-hidden px-6 py-20 sm:py-28"
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url(/landing/backdrop-elder-woman.png)" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#F7F4EE]/88" aria-hidden />

        <div className="mx-auto max-w-xl">
          <p className="text-sm font-semibold tracking-[0.28em] text-[#0B4F8A] uppercase">
            Get the app
          </p>
          <h2 className="site-display mt-3 text-3xl font-semibold leading-tight text-[#0B1F3A] sm:text-4xl">
            Download UNK AI For Android
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#3D4F63] sm:text-xl">
            Install the production app on your phone. Large buttons. Clear steps.
            Built for seniors.
          </p>

          <div className="mt-10">
            <ApkDownloadButton label="Download UNK AI For Android" />
          </div>

          <p className="mt-10 text-base text-[#5A6B7D]">
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

      <footer className="border-t border-[#0B1F3A]/10 bg-[#0B1F3A] px-6 py-10 text-center text-base text-[#A8C4DC]">
        <p className="site-brand text-xl tracking-[0.12em] text-white">UNK AI</p>
        <p className="mt-2">
          The right place for all solutions for the elderly.
        </p>
        <p className="mt-4 text-sm text-[#7A9BB8]">
          © {new Date().getFullYear()} UNK AI — Inclusive by Design.
        </p>
      </footer>

      <style jsx>{`
        .site {
          font-family: "Atkinson Hyperlegible", "Segoe UI", sans-serif;
        }
        .site-brand {
          font-family: Georgia, "Times New Roman", serif;
        }
        .site-display {
          font-family: Georgia, "Times New Roman", serif;
        }
        .site-backdrop {
          animation: site-kenburns 18s ease-in-out infinite alternate;
          transform-origin: center;
        }
        .site-cta {
          box-shadow: 0 14px 36px rgba(244, 180, 0, 0.28);
        }
        @keyframes site-kenburns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.08);
          }
        }
      `}</style>
    </main>
  );
}
