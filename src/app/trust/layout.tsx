import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./trust.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-trust-display",
  weight: ["500", "600", "700"],
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-trust-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Trust AI",
  description: "Personal work-organizing assistant — plan, prioritize, finish.",
};

export default function TrustLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`trust-root ${display.variable} ${body.variable}`}>{children}</div>
  );
}
