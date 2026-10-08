"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, Loader2, Mic, Search } from "lucide-react";
import {
  ElevenLabsVoice,
  startVoiceCall,
  type GroceryVoiceTools,
} from "@/components/grocery/ElevenLabsVoice";
import { GroceryResultCard } from "@/components/grocery/GroceryResultCard";
import { GrocerySummaryCard } from "@/components/grocery/GrocerySummaryCard";
import { openInStore } from "@/lib/grocery/handoff";
import { PLATFORMS } from "@/lib/grocery/platforms";
import { searchGroceries, spokenSummary } from "@/lib/grocery/source";
import type { GrocerySearchResult } from "@/lib/grocery/types";

const QUICK_PICKS = ["Milk", "Bread", "Eggs", "Curd", "Atta", "Bananas"];

const NOTICES: Record<NonNullable<GrocerySearchResult["notice"]>, string> = {
  "no-key": "These are sample prices. Live prices will appear once the price service is connected.",
  "no-location": "These are sample prices. Turn on Location for UNK to see real prices near you.",
  offline: "These are sample prices. Live prices could not be loaded — check the internet and try again.",
};

export function GroceryAssistant({ sample = false }: { sample?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrocerySearchResult | null>(null);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);

  const runSearch = useCallback(
    async (query: string): Promise<GrocerySearchResult | null> => {
      const q = query.trim();
      if (!q) return null;
      setText(q);
      setLoading(true);
      try {
        const next = await searchGroceries(q, { sample });
        setResult(next);
        return next;
      } finally {
        setLoading(false);
      }
    },
    [sample],
  );

  const voiceTools = useMemo<GroceryVoiceTools>(
    () => ({
      searchGroceries: async ({ items, query }) => {
        const found = await runSearch(items || query || "");
        return found ? spokenSummary(found) : "Please tell me which groceries you need.";
      },
      openGroceryApp: ({ platform, item }) => {
        const id = /insta|swiggy/i.test(platform ?? "") ? "instamart" : "blinkit";
        openInStore(id, PLATFORMS[id].searchUrl(item ?? ""));
        return `Opening ${PLATFORMS[id].label}. Please check the cart and pay there.`;
      },
    }),
    [runSearch],
  );

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 bg-[#FBFCFE] px-4 pt-4 pb-48 text-[1.25rem] text-[#0B1F3A] high-contrast:bg-black high-contrast:text-white">
      <header className="flex items-center gap-4 rounded-3xl bg-[#0B1F3A] p-4 text-white high-contrast:bg-black high-contrast:ring-2 high-contrast:ring-white">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 [touch-action:manipulation]"
        >
          <ArrowLeft aria-hidden className="size-8" />
          <span className="sr-only">Back</span>
        </button>
        <div className="min-w-0">
          <p className="text-base font-bold tracking-[0.2em] text-[#F4B400] uppercase">UNK AI</p>
          <h1 className="text-[2rem] leading-tight font-black sm:text-[2.5rem]">
            Grocery Assistant
          </h1>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-3xl border-2 border-[#F4B400] bg-[#FFF8E1] p-5 high-contrast:bg-black">
        <div className="flex items-center gap-3">
          <Mic aria-hidden className="size-9 text-[#0B1F3A] high-contrast:text-[#FFD60A]" />
          <h2 className="text-[2rem] leading-tight font-black">Just say it</h2>
        </div>
        <p className="text-xl leading-relaxed">
          Tap the big button and say something like{" "}
          <em>“I need milk, bread and eggs.”</em> UNK will find the prices for you.
        </p>
        <button
          type="button"
          onClick={() => {
            setVoiceHint(
              startVoiceCall()
                ? null
                : "The voice helper is still loading. Wait a moment and tap again.",
            );
          }}
          className="inline-flex min-h-24 w-full items-center justify-center gap-4 rounded-3xl bg-[#F4B400] px-5 text-3xl font-black text-[#0B1F3A] shadow-md [touch-action:manipulation] focus-visible:ring-4 focus-visible:ring-[#0B4F8A] focus-visible:outline-none active:brightness-95 high-contrast:bg-[#FFD60A] high-contrast:text-black"
        >
          <Mic aria-hidden className="size-10" />
          Talk to UNK
        </button>
        {voiceHint ? (
          <p role="status" className="text-xl font-semibold text-[#C62828]">
            {voiceHint}
          </p>
        ) : null}
      </section>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(text);
        }}
      >
        <label htmlFor="grocery-input" className="text-2xl font-bold">
          Or type what you need
        </label>
        <input
          id="grocery-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="milk, bread, eggs"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-[4.5rem] rounded-2xl border-2 border-[#0B4F8A]/40 bg-white px-5 text-2xl placeholder:text-[#7D8EA0] focus:border-[#0B4F8A] focus:ring-4 focus:ring-[#0B4F8A]/20 focus:outline-none high-contrast:border-white high-contrast:bg-black"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="inline-flex min-h-[4.5rem] items-center justify-center gap-3 rounded-2xl bg-[#0B4F8A] px-5 text-2xl font-extrabold text-white [touch-action:manipulation] disabled:opacity-50 high-contrast:bg-[#FFD60A] high-contrast:text-black"
        >
          {loading ? (
            <Loader2 aria-hidden className="size-8 animate-spin" />
          ) : (
            <Search aria-hidden className="size-8" />
          )}
          {loading ? "Checking prices…" : "Find prices"}
        </button>
        <div className="flex flex-wrap gap-3" aria-label="Quick picks">
          {QUICK_PICKS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => void runSearch(item)}
              className="min-h-14 rounded-full border-2 border-[#0B4F8A]/30 bg-white px-5 text-xl font-bold [touch-action:manipulation] high-contrast:border-white high-contrast:bg-black"
            >
              {item}
            </button>
          ))}
        </div>
      </form>

      <div aria-live="polite" className="flex flex-col gap-5">
        {loading ? (
          <p className="flex items-center gap-3 rounded-3xl bg-white p-6 text-2xl font-bold high-contrast:bg-black">
            <Loader2 aria-hidden className="size-8 animate-spin" />
            Checking Blinkit and Instamart…
          </p>
        ) : null}

        {!loading && result?.notice ? (
          <p className="flex gap-3 rounded-2xl border-2 border-[#0B4F8A]/30 bg-[#EAF2FB] p-4 text-xl font-semibold high-contrast:bg-black">
            <Info aria-hidden className="mt-1 size-7 shrink-0" />
            {NOTICES[result.notice]}
          </p>
        ) : null}

        {!loading && result && result.lines.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-2xl font-bold high-contrast:bg-black">
            Please tell me which groceries you need.
          </p>
        ) : null}

        {!loading && result?.lines.length ? (
          <>
            <h2 className="text-[2rem] leading-tight font-black">
              {result.source === "sample" ? "Sample prices" : "Prices near you"}
            </h2>
            {result.lines.map((line) => (
              <GroceryResultCard key={line.query} line={line} />
            ))}
            <GrocerySummaryCard lines={result.lines} />
          </>
        ) : null}
      </div>

      <ElevenLabsVoice tools={voiceTools} />
    </div>
  );
}
