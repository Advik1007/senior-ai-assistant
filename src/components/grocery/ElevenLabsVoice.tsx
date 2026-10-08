"use client";

import { useEffect, useRef } from "react";

const WIDGET_SCRIPT = "https://unpkg.com/@elevenlabs/convai-widget-embed";

export const ELEVENLABS_AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ||
  "agent_2801m4d445fqfsn90wfref3aqmm0";

/**
 * Client tools the agent can call. Each must also exist (same name, case-sensitive)
 * under Tools → Client in the ElevenLabs agent settings.
 */
export type GroceryVoiceTools = {
  searchGroceries: (params: { items?: string; query?: string }) => Promise<string>;
  openGroceryApp: (params: { platform?: string; item?: string }) => string;
};

/** Presses the widget's own "Start a call" button so a big in-page button can start the conversation. */
export function startVoiceCall(): boolean {
  const widget = document.querySelector("elevenlabs-convai");
  const buttons = widget?.shadowRoot?.querySelectorAll("button") ?? [];
  for (const button of buttons) {
    const label = `${button.getAttribute("aria-label") ?? ""} ${button.textContent ?? ""}`;
    if (/start|call|talk/i.test(label)) {
      button.click();
      return true;
    }
  }
  return false;
}

type CallEvent = CustomEvent<{
  config: { clientTools?: Record<string, (params: never) => unknown> };
}>;

export function ElevenLabsVoice({ tools }: { tools: GroceryVoiceTools }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef(tools);

  useEffect(() => {
    toolsRef.current = tools;
  }, [tools]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const widget = document.createElement("elevenlabs-convai");
    widget.setAttribute("agent-id", ELEVENLABS_AGENT_ID);
    widget.setAttribute("action-text", "Talk to UNK");
    widget.setAttribute("start-call-text", "Start talking");
    widget.setAttribute("end-call-text", "Stop");
    widget.setAttribute("listening-text", "Listening…");
    widget.setAttribute("speaking-text", "UNK is speaking");

    const onCall = (event: Event) => {
      (event as CallEvent).detail.config.clientTools = {
        searchGroceries: (params: { items?: string; query?: string }) =>
          toolsRef.current.searchGroceries(params ?? {}),
        openGroceryApp: (params: { platform?: string; item?: string }) =>
          toolsRef.current.openGroceryApp(params ?? {}),
      };
    };
    widget.addEventListener("elevenlabs-convai:call", onCall);
    host.appendChild(widget);

    if (!document.querySelector(`script[src="${WIDGET_SCRIPT}"]`)) {
      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT;
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }

    return () => {
      widget.removeEventListener("elevenlabs-convai:call", onCall);
      widget.remove();
    };
  }, []);

  return <div ref={hostRef} />;
}
