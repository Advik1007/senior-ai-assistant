"use client";

import { AppShell } from "@/components/AppShell";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useApp } from "@/components/providers/app-provider";

export default function TalkPage() {
  const { strings } = useApp();

  return (
    <AppShell title={strings.talkTitle}>
      <VoiceAssistant mode="talk" greeting={strings.talkGreeting} />
    </AppShell>
  );
}
