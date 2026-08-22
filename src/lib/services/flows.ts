import type { BookingRecord } from "@/lib/db/schema";
import type { BookingProvider, ServiceQuote } from "@/lib/services/types";

export type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "tel";
};

export type ServiceKind = BookingRecord["kind"];

export type ServiceFlow = {
  slug: string;
  kind: ServiceKind;
  titleKey: "bookCab" | "bookFlight" | "payBills" | "bookNurse" | "bookBloodTest";
  medical?: boolean;
  fields: FieldDef[];
  provider: BookingProvider;
};

export function detailsSummary(fields: FieldDef[], values: Record<string, string>): string {
  return fields
    .map((field) => `${field.label}: ${values[field.key] || "—"}`)
    .join(" · ");
}

export function quoteSummary(quote: ServiceQuote): string {
  return `${quote.providerName}. ${quote.summary}. ${quote.whenLabel}. Total ${quote.currency} ${quote.totalPrice}.`;
}
