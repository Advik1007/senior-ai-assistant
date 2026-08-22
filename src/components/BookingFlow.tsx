"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BookingRecord } from "@/lib/db/schema";
import { saveBookingRecord } from "@/lib/storage/bookings";
import { detailsSummary, quoteSummary, type ServiceFlow } from "@/lib/services/flows";
import type { ServiceQuote } from "@/lib/services/types";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "form" | "quotes" | "confirm1" | "confirm2" | "blocked";

export function BookingFlow({ flow }: { flow: ServiceFlow }) {
  const searchParams = useSearchParams();
  const { strings, profile } = useApp();
  const initial = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of flow.fields) {
      values[field.key] = searchParams.get(field.key) ?? "";
    }
    return values;
  }, [flow.fields, searchParams]);

  const [values, setValues] = useState(initial);
  const [step, setStep] = useState<Step>("form");
  const [message, setMessage] = useState("");
  const [quotes, setQuotes] = useState<ServiceQuote[]>([]);
  const [selected, setSelected] = useState<ServiceQuote | null>(null);
  const [busy, setBusy] = useState(false);

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function missingFields() {
    return flow.fields.filter((field) => !values[field.key]?.trim());
  }

  async function search() {
    const missing = missingFields();
    if (missing.length) {
      setMessage(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setBusy(true);
    setMessage("");
    const draft: BookingRecord = {
      id: crypto.randomUUID(),
      kind: flow.kind,
      summary: detailsSummary(flow.fields, values),
      status: "draft",
      totalPrice: null,
      currency: "INR",
      createdAt: new Date().toISOString(),
      providerConfirmationId: null,
    };
    saveBookingRecord(draft);

    const response = await fetch(`/api/services/${flow.slug}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ details: values }),
    });
    const data = (await response.json()) as {
      status: string;
      message?: string;
      quotes?: ServiceQuote[];
    };
    setBusy(false);

    if (!response.ok || !data.quotes?.length) {
      saveBookingRecord({ ...draft, status: "failed" });
      setStep("blocked");
      setMessage(
        data.message ||
          "API connection required. Nothing was booked or paid.",
      );
      return;
    }

    setQuotes(data.quotes);
    setStep("quotes");
  }

  async function finishBooking() {
    if (!selected) return;
    setBusy(true);
    const response = await fetch(`/api/services/${flow.slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: selected.id,
        firstConfirmed: true,
        secondConfirmed: true,
      }),
    });
    const data = (await response.json()) as {
      status: string;
      confirmationId?: string;
      message?: string;
    };
    setBusy(false);
    if (data.status !== "confirmed" || !data.confirmationId) {
      setStep("blocked");
      setMessage(data.message || "Booking was not confirmed. Nothing was paid.");
      return;
    }
    saveBookingRecord({
      id: crypto.randomUUID(),
      kind: flow.kind,
      summary: quoteSummary(selected),
      status: "confirmed",
      totalPrice: selected.totalPrice,
      currency: selected.currency,
      createdAt: new Date().toISOString(),
      providerConfirmationId: data.confirmationId,
    });
    setMessage(`Booked. Confirmation ${data.confirmationId}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {flow.medical ? (
        <p className="rounded-2xl bg-[#FFF4CC] p-4 text-xl font-semibold">
          {strings.notMedicalAdvice}
        </p>
      ) : null}
      <p className="text-xl font-bold">{strings.neverAutoPay}</p>

      {step === "form" || step === "blocked" ? (
        <>
          {flow.fields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key} className="text-xl font-bold">
                {field.label}
              </Label>
              <Input
                id={field.key}
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                inputMode={field.inputMode}
                onChange={(e) => setField(field.key, e.target.value)}
                className="mt-1 h-14 rounded-xl border-2 text-xl md:text-xl"
              />
            </div>
          ))}
          <BigButton tone="primary" disabled={busy} onClick={search}>
            {busy ? "Searching…" : "Search"}
          </BigButton>
        </>
      ) : null}

      {step === "quotes" ? (
        <>
          <p className="text-2xl font-extrabold">Choose one option</p>
          {quotes.map((quote) => (
            <BigButton
              key={quote.id}
              tone="service"
              onClick={() => {
                setSelected(quote);
                setStep("confirm1");
              }}
            >
              {quote.providerName}: {quote.currency} {quote.totalPrice}
            </BigButton>
          ))}
        </>
      ) : null}

      {step === "confirm1" && selected ? (
        <>
          <p className="text-2xl font-extrabold">First confirmation</p>
          <p className="text-xl">{quoteSummary(selected)}</p>
          <p className="text-xl">{detailsSummary(flow.fields, values)}</p>
          <BigButton tone="call" onClick={() => setStep("confirm2")}>
            Yes, this is correct
          </BigButton>
          <BigButton tone="muted" onClick={() => setStep("quotes")}>
            No, go back
          </BigButton>
        </>
      ) : null}

      {step === "confirm2" && selected ? (
        <>
          <p className="text-2xl font-extrabold">Please confirm again</p>
          <p className="text-xl">
            I will ask the company to book this: {quoteSummary(selected)}
          </p>
          {profile.email ? (
            <p className="text-xl">A confirmation email can go to {profile.email} only after a real booking.</p>
          ) : null}
          <BigButton tone="help" disabled={busy} onClick={finishBooking}>
            {busy ? "Working…" : "Yes, book it now"}
          </BigButton>
          <BigButton tone="muted" onClick={() => setStep("confirm1")}>
            No, cancel
          </BigButton>
        </>
      ) : null}

      {message ? (
        <div className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-5 text-xl high-contrast:border-white high-contrast:bg-black">
          <p className="mb-2 text-2xl font-extrabold">
            {step === "blocked" ? "API connection required" : "Note"}
          </p>
          <p>{message}</p>
          <p className="mt-3">{strings.serviceApiRequired}</p>
        </div>
      ) : null}
    </div>
  );
}
