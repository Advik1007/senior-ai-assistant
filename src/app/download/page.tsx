import Link from "next/link";
import { ApkDownloadButton } from "@/components/ApkDownloadButton";
import { UnkLogo } from "@/components/UnkLogo";

export const metadata = {
  title: "Download UNK AI for Android",
  description:
    "Download the production UNK AI Android app and install it in clear, senior-friendly steps.",
};

/** Focused download page — responsive for phone, tablet, and desktop. */
export default function DownloadPage() {
  return (
    <main className="min-h-svh bg-[#F7F4EE] px-4 py-10 text-[#0B1F3A] sm:px-8 sm:py-12 md:px-12">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 sm:max-w-2xl sm:gap-8">
        <header className="flex items-start gap-3 sm:items-center sm:gap-4">
          <UnkLogo className="size-12 shrink-0 sm:size-16" />
          <div className="min-w-0">
            <p
              className="text-xs font-semibold tracking-[0.2em] text-[#0B4F8A] uppercase sm:text-sm"
              style={{ fontFamily: "Georgia, Times New Roman, serif" }}
            >
              UNK AI
            </p>
            <h1
              className="text-[clamp(1.5rem,5vw,2.25rem)] font-bold leading-tight"
              style={{ fontFamily: "Georgia, Times New Roman, serif" }}
            >
              Download UNK AI For Android
            </h1>
          </div>
        </header>

        <p className="text-base leading-relaxed text-[#2A3A4D] sm:text-xl">
          The right place for all solutions for the elderly — install the
          production app on your Android phone.
        </p>

        <ApkDownloadButton
          className="max-w-none"
          label="Download UNK AI For Android"
        />

        <p className="flex flex-col gap-2 text-base text-[#5A6B7D] sm:flex-row sm:flex-wrap sm:gap-x-2 sm:text-lg">
          <Link
            href="/"
            className="font-semibold text-[#0B4F8A] underline-offset-4 hover:underline"
          >
            Back to the UNK AI website
          </Link>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <Link
            href="/start"
            className="font-semibold text-[#0B4F8A] underline-offset-4 hover:underline"
          >
            Open the web app
          </Link>
        </p>
      </div>
    </main>
  );
}
