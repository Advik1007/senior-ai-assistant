"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type InboxMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function InboxInner() {
  const params = useSearchParams();
  const secretFromUrl = params.get("secret")?.trim() || "";
  const [secret, setSecret] = useState(secretFromUrl);
  const [unlocked, setUnlocked] = useState(Boolean(secretFromUrl));
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (key: string) => {
    if (!key.trim()) {
      setError("Enter your inbox secret.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/inbox/messages?secret=${encodeURIComponent(key.trim())}`,
        { cache: "no-store" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        messages?: InboxMessage[];
        message?: string;
      };
      if (!res.ok) {
        setUnlocked(false);
        setMessages([]);
        setError(data.message || "Could not open inbox.");
        return;
      }
      setMessages(data.messages ?? []);
      setUnlocked(true);
      try {
        sessionStorage.setItem("unk.inbox.secret", key.trim());
      } catch {
        // ignore
      }
    } catch {
      setError("Network error loading inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (secretFromUrl) {
      void load(secretFromUrl);
      return;
    }
    try {
      const saved = sessionStorage.getItem("unk.inbox.secret");
      if (saved) {
        setSecret(saved);
        void load(saved);
      }
    } catch {
      // ignore
    }
  }, [secretFromUrl, load]);

  return (
    <div className="mx-auto min-h-svh w-full max-w-3xl bg-[#F4F1E8] px-4 py-8 text-[#0B1F3A]">
      <header className="mb-8 border-b border-[#0B1F3A]/15 pb-4">
        <p className="text-sm font-semibold tracking-[0.2em] text-[#0B4F8A] uppercase">
          UNK AI
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">Support inbox</h1>
        <p className="mt-2 text-lg text-[#5a6f85]">
          Issues and messages from Help → Email UNK AI (name, email, phone,
          complaint).
        </p>
      </header>

      {!unlocked ? (
        <form
          className="flex flex-col gap-3 rounded-2xl border border-[#0B1F3A]/15 bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void load(secret);
          }}
        >
          <label className="text-lg font-semibold" htmlFor="inbox-secret">
            Inbox secret
          </label>
          <input
            id="inbox-secret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="h-14 rounded-xl border-2 border-[#0B1F3A]/20 px-3 text-lg"
            placeholder="INBOX_SECRET from env"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading}
            className="min-h-14 rounded-2xl bg-[#0B4F8A] px-5 text-xl font-bold text-white disabled:opacity-50"
          >
            {loading ? "Opening…" : "Open inbox"}
          </button>
          {error ? (
            <p className="text-lg font-semibold text-[#B00020]" role="alert">
              {error}
            </p>
          ) : null}
          <p className="text-base text-[#5a6f85]">
            Set <code className="rounded bg-[#EEF3F8] px-1">INBOX_SECRET</code>{" "}
            in Vercel, then open{" "}
            <code className="rounded bg-[#EEF3F8] px-1">
              /inbox?secret=your-secret
            </code>
            .
          </p>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold">
              {messages.length} message{messages.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => void load(secret)}
              disabled={loading}
              className="min-h-12 rounded-xl border-2 border-[#0B1F3A] bg-white px-4 text-lg font-bold disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {error ? (
            <p className="text-lg font-semibold text-[#B00020]" role="alert">
              {error}
            </p>
          ) : null}

          {messages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#0B1F3A]/25 bg-white p-6 text-lg text-[#5a6f85]">
              No messages yet. When someone uses Help → Email UNK AI, it appears
              here.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className="rounded-2xl border border-[#0B1F3A]/12 bg-white p-5 shadow-[0_1px_3px_rgba(11,31,58,0.06)]"
                >
                  <p className="text-sm font-semibold text-[#5a6f85]">
                    {formatWhen(m.createdAt)}
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold">{m.name}</h2>
                  <dl className="mt-3 grid gap-2 text-lg">
                    <div>
                      <dt className="inline font-semibold">Email: </dt>
                      <dd className="inline">
                        <a
                          className="text-[#0B4F8A] underline-offset-2 hover:underline"
                          href={`mailto:${m.email}`}
                        >
                          {m.email}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">Phone: </dt>
                      <dd className="inline">
                        {m.phone ? (
                          <a
                            className="text-[#0B4F8A] underline-offset-2 hover:underline"
                            href={`tel:${m.phone}`}
                          >
                            {m.phone}
                          </a>
                        ) : (
                          <span className="text-[#8a9bb0]">Not provided</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f3f7fb] p-4 text-lg leading-relaxed">
                    {m.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-xl font-semibold text-[#0B1F3A]">
          Loading inbox…
        </div>
      }
    >
      <InboxInner />
    </Suspense>
  );
}
