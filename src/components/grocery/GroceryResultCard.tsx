"use client";

import { ExternalLink, PackageSearch } from "lucide-react";
import { StoreBadge } from "@/components/grocery/StoreBadge";
import { openOffer } from "@/lib/grocery/handoff";
import { PLATFORMS } from "@/lib/grocery/platforms";
import { formatRupees } from "@/lib/grocery/source";
import type { GroceryLine } from "@/lib/grocery/types";

export function GroceryResultCard({ line }: { line: GroceryLine }) {
  const [best, ...others] = line.offers;

  if (!best) {
    return (
      <article className="rounded-3xl border-2 border-[#C9D6E3] bg-white p-5 high-contrast:border-white high-contrast:bg-black">
        <p className="text-2xl font-bold capitalize">{line.query}</p>
        <p className="mt-2 text-xl text-[#5A6B7D] high-contrast:text-white">
          Not available nearby right now.
        </p>
      </article>
    );
  }

  const info = PLATFORMS[best.platform];
  const saving = best.mrp != null && best.mrp > best.price ? best.mrp - best.price : 0;

  return (
    <article
      className="flex flex-col gap-4 rounded-3xl border-2 border-[#C9D6E3] bg-white p-5 shadow-sm high-contrast:border-white high-contrast:bg-black"
      aria-label={`${line.query}: ${best.name}`}
    >
      <p className="text-lg font-bold tracking-wide text-[#5A6B7D] uppercase high-contrast:text-[#FFD60A]">
        You asked for: {line.query}
      </p>

      <div className="flex items-start gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F2F6FA] high-contrast:bg-white">
          {best.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={best.image} alt="" className="size-full object-contain" />
          ) : (
            <PackageSearch aria-hidden className="size-12 text-[#0B4F8A]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl leading-snug font-extrabold text-[#0B1F3A] high-contrast:text-white">
            {best.name}
          </h3>
          <p className="mt-1 text-xl font-semibold text-[#1B3A5C] high-contrast:text-white">
            {best.quantity}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-5xl font-black text-[#0B1F3A] high-contrast:text-[#FFD60A]">
          {formatRupees(best.price)}
          {saving > 0 ? (
            <span className="ml-3 align-middle text-xl font-semibold text-[#5A6B7D] line-through high-contrast:text-white">
              {formatRupees(best.mrp!)}
            </span>
          ) : null}
        </p>
        <StoreBadge platform={best.platform} eta={best.eta} />
      </div>

      <button
        type="button"
        onClick={() => openOffer(best, line.query)}
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

      {others.map((offer) => {
        const other = PLATFORMS[offer.platform];
        return (
          <div
            key={offer.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F2F6FA] p-4 high-contrast:bg-black high-contrast:ring-2 high-contrast:ring-white"
          >
            <p className="text-xl font-semibold text-[#1B3A5C] high-contrast:text-white">
              Also on {other.label}:{" "}
              <span className="font-extrabold text-[#0B1F3A] high-contrast:text-[#FFD60A]">
                {formatRupees(offer.price)}
              </span>
              {offer.eta ? ` · ${offer.eta}` : ""}
            </p>
            <button
              type="button"
              onClick={() => openOffer(offer, line.query)}
              className="min-h-14 rounded-xl border-2 border-[#0B4F8A] bg-white px-4 text-xl font-bold text-[#0B4F8A] [touch-action:manipulation] high-contrast:border-white high-contrast:bg-black high-contrast:text-white"
            >
              Open in {other.label}
            </button>
          </div>
        );
      })}
    </article>
  );
}
