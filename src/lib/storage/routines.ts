import { readJson, writeJson } from "@/lib/storage/local-store";

const KEY = "unk.routines";

export type RoutineItem = {
  id: string;
  title: string;
  time: string;
  days: string;
  notes?: string;
  kind: "reminder" | "medicine" | "appointment" | "task";
};

export function loadRoutines(): RoutineItem[] {
  return readJson<RoutineItem[]>(KEY, []);
}

export function saveRoutines(items: RoutineItem[]): void {
  writeJson(KEY, items);
}

export function replaceRoutines(
  items: Omit<RoutineItem, "id">[],
): RoutineItem[] {
  const next = items.map((item) => ({ ...item, id: crypto.randomUUID() }));
  saveRoutines(next);
  return next;
}

export function addRoutine(item: Omit<RoutineItem, "id">): RoutineItem[] {
  const next = [
    ...loadRoutines(),
    { ...item, id: crypto.randomUUID() },
  ];
  saveRoutines(next);
  return next;
}

export function removeRoutine(id: string): RoutineItem[] {
  const next = loadRoutines().filter((r) => r.id !== id);
  saveRoutines(next);
  return next;
}
