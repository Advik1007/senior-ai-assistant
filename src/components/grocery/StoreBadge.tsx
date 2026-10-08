import { Clock } from "lucide-react";
import { PLATFORMS } from "@/lib/grocery/platforms";
import type { PlatformId } from "@/lib/grocery/types";

export function StoreBadge({
  platform,
  eta,
}: {
  platform: PlatformId;
  eta?: string | null;
}) {
  const info = PLATFORMS[platform];
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        className="rounded-full px-4 py-1 text-lg font-extrabold"
        style={{ backgroundColor: info.color, color: info.textColor }}
      >
        {info.label}
      </span>
      {eta ? (
        <span className="inline-flex items-center gap-1 text-lg font-semibold text-[#1B3A5C] high-contrast:text-white">
          <Clock aria-hidden className="size-5" />
          {eta}
        </span>
      ) : null}
    </span>
  );
}
