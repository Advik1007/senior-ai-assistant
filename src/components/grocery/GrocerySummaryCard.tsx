"use client";

import { ExternalLink, ShoppingCart } from "lucide-react";
import { openInStore } from "@/lib/grocery/handoff";
import { PLATFORMS } from "@/lib/grocery/platforms";
import { formatRupees, grandTotal, storeTotals } from "@/lib/grocery/source";
import type { GroceryLine } from "@/lib/grocery/types";

export function GrocerySummaryCard({ lines }: { lines: GroceryLine[] }) {
  const found = lines.filter((l) => l.offers.length > 0);
  if (!found.length) return null;

  const total = grandTotal(found);
  const stores = storeTotals(found);
  const firstItem = found[0]!.query;

  return (
    <section
      aria-label="Grand total"
      className="flex flex-col gap-5 rounded-3xl border-4 border-[#0B1F3A] bg-[#FFF8E1] p-6 high-contrast:border-white high-contrast:bg-black"
    >
      <div className="flex items-center gap-3">
        <ShoppingCart aria-hidden className="size-9 text-[#0B1F3A] high-contrast:text-[#FFD60A]" />
        <h2 className="text-[2rem] leading-tight font-black text-[#0B1F3A] high-contrast:text-white">
          Grand total
        </h2>
      </div>

      <div>
        <p className="text-6xl font-black text-[#0B1F3A] high-contrast:text-[#FFD60A]">
          {formatRupees(total)}
        </p>
        <p className="mt-2 text-xl text-[#1B3A5C] high-contrast:text-white">
          Best price for {found.length} {found.length === 1 ? "item" : "items"}. Delivery
          fees are shown in the app.
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {stores.map((s) => {
          const info = PLATFORMS[s.platform];
          return (
            <li
              key={s.platform}
              className="flex flex-col gap-3 rounded-2xl bg-white p-4 high-contrast:bg-black high-contrast:ring-2 high-contrast:ring-white"
            >
              <p className="text-xl font-semibold text-[#1B3A5C] high-contrast:text-white">
                Everything from {info.label}:{" "}
                <span className="text-2xl font-black text-[#0B1F3A] high-contrast:text-[#FFD60A]">
                  {formatRupees(s.total)}
                </span>
                {s.found < found.length
                  ? ` (${s.found} of ${found.length} items available)`
                  : ""}
              </p>
              <button
                type="button"
                onClick={() => openInStore(s.platform, info.searchUrl(firstItem))}
                className="inline-flex min-h-[4.5rem] w-full items-center justify-center gap-3 rounded-2xl border-2 px-5 text-2xl font-extrabold [touch-action:manipulation] focus-visible:ring-4 focus-visible:ring-[#0B4F8A] focus-visible:outline-none active:brightness-95"
                style={{
                  backgroundColor: info.color,
                  borderColor: info.color,
                  color: info.textColor,
                }}
              >
                <ExternalLink aria-hidden className="size-7" />
                Open in {info.label}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-lg font-semibold text-[#5A6B7D] high-contrast:text-white">
        UNK only compares prices. You check the cart and pay inside the app yourself.
      </p>
    </section>
  );
}
