import Link from "next/link";
import { ApkDownloadButton } from "@/components/ApkDownloadButton";
import { UnkLogo } from "@/components/UnkLogo";

export const metadata = {
  title: "Download UNK AI for Android",
  description:
    "Download the production UNK AI Android app and install it in clear, senior-friendly steps.",
};

/** Focused download page — same production APK as the homepage section. */
export default function DownloadPage() {
  return (
    <main className="min-h-svh bg-[#F7F4EE] px-6 py-12 text-[#0B1F3A]">
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <header className="flex items-center gap-4">
          <UnkLogo className="size-16 shrink-0" />
          <div>
            <p
              className="text-sm font-semibold tracking-[0.2em] text-[#0B4F8A] uppercase"
              style={{ fontFamily: "Georgia, Times New Roman, serif" }}
            >
              UNK AI
            </p>
            <h1
              className="text-3xl font-bold leading-tight sm:text-4xl"
              style={{ fontFamily: "Georgia, Times New Roman, serif" }}
            >
              Download UNK AI For Android
            </h1>
          </div>
        </header>

        <p className="text-xl leading-relaxed text-[#2A3A4D]">
          The right place for all solutions for the elderly — install the
          production app on your Android phone.
        </p>

        <ApkDownloadButton label="Download UNK AI For Android" />

        <p className="text-lg text-[#5A6B7D]">
          <Link
            href="/"
            className="font-semibold text-[#0B4F8A] underline-offset-4 hover:underline"
          >
            Back to the UNK AI website
          </Link>
          {" · "}
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
