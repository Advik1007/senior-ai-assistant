"use client";

/** Last-resort recovery if the root layout itself crashes. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#E8EEF5] text-[#0B1F3A]">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-5 px-4 text-center">
          <p className="text-2xl font-bold leading-snug">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            className="inline-flex min-h-[4.25rem] items-center justify-center rounded-2xl bg-[#0B4F8A] px-4 text-xl font-bold text-white"
            onClick={() => reset()}
          >
            OK
          </button>
        </div>
      </body>
    </html>
  );
}
