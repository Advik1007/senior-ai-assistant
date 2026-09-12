import { Download } from "lucide-react";

/** Production release APK served from /public/downloads. */
export const RELEASE_APK_HREF = "/downloads/unk-ai-release.apk?v=1.0.7";
export const RELEASE_APK_FILENAME = "unk-ai-release.apk";

type Props = {
  className?: string;
  /** Override label (default: Download UNK AI for Android) */
  label?: string;
  showHelper?: boolean;
};

/**
 * Giant, senior-friendly APK download control — scales for phone / tablet / PC.
 */
export function ApkDownloadButton({
  className = "",
  label = "Download UNK AI for Android",
  showHelper = true,
}: Props) {
  return (
    <div className={`w-full max-w-xl ${className}`}>
      <a
        href={RELEASE_APK_HREF}
        download={RELEASE_APK_FILENAME}
        type="application/vnd.android.package-archive"
        className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#041018] bg-[#0B1F3A] px-4 py-4 text-center text-lg font-bold leading-tight text-white shadow-sm transition-transform hover:bg-[#132a48] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4B400] focus-visible:ring-offset-2 active:scale-[0.99] sm:min-h-20 sm:gap-3 sm:px-6 sm:py-5 sm:text-2xl sm:focus-visible:ring-offset-4"
      >
        <Download className="size-6 shrink-0 sm:size-8" aria-hidden />
        <span className="text-balance">{label}</span>
      </a>

      {showHelper ? (
        <div className="mt-5 space-y-3 text-left text-base leading-relaxed text-[#0B1F3A] sm:text-lg">
          <p className="font-semibold">How to install on Android</p>
          <ol className="list-decimal space-y-2 pl-5 sm:pl-6">
            <li>
              Tap the dark blue button above to download{" "}
              <strong>{RELEASE_APK_FILENAME}</strong>.
            </li>
            <li>Open the Downloads folder on your phone and tap the file.</li>
            <li>
              If Android asks, allow install from this source, then tap{" "}
              <strong>Install</strong>.
            </li>
            <li>
              Open <strong>UNK AI</strong> from your home screen.
            </li>
          </ol>
          <p className="text-sm text-[#5A6B7D] sm:text-base">
            Tip: use Chrome on your Android phone for the simplest install.
          </p>
        </div>
      ) : null}
    </div>
  );
}
