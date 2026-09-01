import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ThemeSync } from "@/components/ThemeSync";
import "./globals.css";

const readable = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "UNK AI",
  description: "A simple assistant for everyday help, calling family, and services.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "UNK AI",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B4F8A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${readable.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F4F1E8] font-sans text-[#0B1F3A]">
        <AppProvider>
          <ThemeSync />
          <OnboardingGate>{children}</OnboardingGate>
        </AppProvider>
      </body>
    </html>
  );
}
