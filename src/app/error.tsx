"use client";

/** Recover from a page crash without the default Next.js error overlay. */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-5 px-4 text-center">
      <p className="text-2xl font-bold leading-snug text-[#0B1F3A]">
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
  );
}
