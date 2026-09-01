const KEY = "unk.conversation-memory";
const MAX = 20;

export function loadMemory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(-MAX) : [];
  } catch {
    return [];
  }
}

export function saveMemory(facts: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(facts.slice(-MAX)));
}

export function remember(fact: string): string[] {
  if (!isMemoryEnabled()) return loadMemory();
  const trimmed = fact.trim();
  if (!trimmed) return loadMemory();
  const next = [...loadMemory().filter((f) => f !== trimmed), trimmed];
  saveMemory(next);
  return next;
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const HISTORY_KEY = "unk.chat-history";

export function loadChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function appendChatHistory(message: ChatMessage): ChatMessage[] {
  const next = [...loadChatHistory(), message].slice(-12);
  if (typeof window !== "undefined") {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearChatHistory(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(HISTORY_KEY);
  }
}

const MEMORY_ENABLED_KEY = "unk.memory-enabled";

export function isMemoryEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MEMORY_ENABLED_KEY) !== "off";
}

export function setMemoryEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMORY_ENABLED_KEY, on ? "on" : "off");
}

export function clearMemory(): void {
  saveMemory([]);
  clearChatHistory();
}

export function deleteMemoryFact(fact: string): string[] {
  const next = loadMemory().filter((f) => f !== fact);
  saveMemory(next);
  return next;
}
