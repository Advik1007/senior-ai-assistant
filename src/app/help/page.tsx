"use client";

import { AppShell } from "@/components/AppShell";
import { ContactEmailForm } from "@/components/ContactEmailForm";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useApp } from "@/components/providers/app-provider";

export default function HelpPage() {
  const { strings } = useApp();

  return (
    <AppShell title={strings.helpTitle}>
      <VoiceAssistant mode="help" greeting={strings.helpGreeting} />
      <ContactEmailForm />
    </AppShell>
  );
}
