"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addRoutine,
  loadRoutines,
  removeRoutine,
  type RoutineItem,
} from "@/lib/storage/routines";

export default function RoutinePage() {
  const { strings } = useApp();
  const [items, setItems] = useState<RoutineItem[]>(loadRoutines);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState("");

  function onAdd() {
    if (!title.trim()) return;
    const next = addRoutine({
      title: title.trim(),
      time: time || strings.routineAnytime,
      days: days || strings.routineDaily,
      kind: "task",
    });
    setItems(next);
    setTitle("");
    setTime("");
    setDays("");
  }

  return (
    <AppShell title={strings.routineTitle}>
      <p className="text-xl">{strings.routineIntro}</p>

      {items.length === 0 ? (
        <p className="text-xl opacity-80">{strings.routineEmpty}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4 text-xl"
            >
              <p className="font-extrabold">{item.title}</p>
              <p>
                {item.time} · {item.days}
              </p>
              <BigButton
                tone="muted"
                className="mt-3 min-h-16 text-xl"
                onClick={() => setItems(removeRoutine(item.id))}
              >
                {strings.routineRemove}
              </BigButton>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
        <Label className="text-lg">{strings.routineTask}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 h-14 rounded-xl border-2 text-xl"
        />
        <Label className="mt-3 text-lg">{strings.routineTime}</Label>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 h-14 rounded-xl border-2 text-xl"
        />
        <Label className="mt-3 text-lg">{strings.routineDays}</Label>
        <Input
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder={strings.routineDaily}
          className="mt-1 h-14 rounded-xl border-2 text-xl"
        />
        <BigButton tone="call" className="mt-4" onClick={onAdd}>
          {strings.routineAdd}
        </BigButton>
      </section>

      <BigButton href="/talk" tone="primary">
        {strings.routineVoice}
      </BigButton>
    </AppShell>
  );
}
