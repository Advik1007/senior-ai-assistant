"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export function ContactEmailForm() {
  const { profile, prefs } = useApp();
  const isHindi = prefs.language === "hi";
  const [name, setName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: "sending" });

    try {
      const response = await fetch("/api/email/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(
          result.message ||
            (isHindi
              ? "संदेश नहीं भेजा जा सका।"
              : "The message could not be sent."),
        );
      }

      setMessage("");
      setStatus({
        state: "success",
        message: isHindi
          ? "आपका संदेश भेज दिया गया है।"
          : "Your message has been sent.",
      });
    } catch (error) {
      setStatus({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : isHindi
              ? "संदेश नहीं भेजा जा सका।"
              : "The message could not be sent.",
      });
    }
  }

  const sending = status.state === "sending";

  return (
    <section className="mt-4 rounded-2xl border-4 border-[#0B1F3A] bg-white p-5 high-contrast:border-white high-contrast:bg-black">
      <h2 className="text-2xl font-extrabold">
        {isHindi ? "हमें ईमेल करें" : "Email UNK AI"}
      </h2>
      <p className="mt-1 text-lg text-[#0B4F8A] high-contrast:text-[#FFD60A]">
        {isHindi
          ? "सहायता के लिए हमें संदेश भेजें।"
          : "Send us a message if you need support."}
      </p>

      <form className="mt-5 flex flex-col gap-4" onSubmit={submit}>
        <div>
          <Label htmlFor="contact-name" className="text-lg font-bold">
            {isHindi ? "नाम" : "Name"}
          </Label>
          <Input
            id="contact-name"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-14 rounded-xl border-2 text-lg"
          />
        </div>
        <div>
          <Label htmlFor="contact-email" className="text-lg font-bold">
            {isHindi ? "ईमेल" : "Email"}
          </Label>
          <Input
            id="contact-email"
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-14 rounded-xl border-2 text-lg"
          />
        </div>
        <div>
          <Label htmlFor="contact-message" className="text-lg font-bold">
            {isHindi ? "संदेश" : "Message"}
          </Label>
          <Textarea
            id="contact-message"
            required
            minLength={10}
            maxLength={5000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-2 min-h-32 rounded-xl border-2 text-lg"
          />
        </div>
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="contact-website">Website</Label>
          <Input
            id="contact-website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={sending}
          className="min-h-16 rounded-2xl bg-[#0B4F8A] px-6 text-xl font-bold text-white"
        >
          {sending
            ? isHindi
              ? "भेज रहा है…"
              : "Sending…"
            : isHindi
              ? "संदेश भेजें"
              : "Send message"}
        </Button>
        {status.state === "success" || status.state === "error" ? (
          <p
            role="status"
            className={`text-lg font-bold ${
              status.state === "error" ? "text-[#B00020]" : "text-[#146C2E]"
            }`}
          >
            {status.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}

