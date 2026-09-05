"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { RoutineCalendar } from "@/components/routine/RoutineCalendar";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addRoutine,
  eventsForDay,
  loadRoutines,
  recurringItems,
  removeRoutine,
  toDateKey,
  type RoutineItem,
} from "@/lib/storage/routines";

function kindLabel(
  kind: RoutineItem["kind"],
  strings: ReturnType<typeof useApp>["strings"],
): string {
  switch (kind) {
    case "appointment":
      return strings.routineKindAppointment;
    case "medicine":
      return strings.routineKindMedicine;
    case "reminder":
      return strings.routineKindReminder;
    default:
      return strings.routineKindTask;
  }
}

export function RoutinePageContent() {
  const searchParams = useSearchParams();
  const { strings } = useApp();
  const [items, setItems] = useState<RoutineItem[]>(() => loadRoutines());
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateKey(now));
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const q = searchParams.get("date");
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
      setSelectedDate(q);
      const [y, m] = q.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [searchParams]);

  const dayItems = useMemo(
    () => eventsForDay(items, selectedDate),
    [items, selectedDate],
  );
  const recurring = useMemo(() => recurringItems(items), [items]);

  function onAdd() {
    if (!title.trim()) return;
    const next = addRoutine({
      title: title.trim(),
      time: time || strings.routineAnytime,
      days: "once",
      date: selectedDate,
      kind: /doctor|clinic|appointment/i.test(title)
        ? "appointment"
        : "reminder",
    });
    setItems(next);
    setTitle("");
    setTime("");
  }

  return (
    <AppShell title={strings.routineTitle}>
      <p className="text-lg leading-relaxed text-[#29445e]">{strings.routineIntro}</p>

      <RoutineCalendar
        strings={strings}
        items={items}
        viewYear={viewYear}
        viewMonth={viewMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onChangeMonth={(y, m) => {
          setViewYear(y);
          setViewMonth(m);
        }}
      />

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
        <h3 className="mb-3 text-xl font-extrabold">
          {strings.routineDayAgenda} · {selectedDate}
        </h3>
        {dayItems.length === 0 ? (
          <p className="text-lg opacity-80">{strings.routineDayEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {dayItems.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border-2 border-[#0B1F3A]/20 p-3"
              >
                <p className="text-xl font-extrabold">{item.title}</p>
                <p className="text-base text-[#29445e]">
                  {kindLabel(item.kind, strings)}
                  {item.time ? ` · ${item.time}` : ""}
                </p>
                <BigButton
                  tone="muted"
                  className="mt-2 min-h-14 text-lg"
                  onClick={() => setItems(removeRoutine(item.id))}
                >
                  {strings.routineRemove}
                </BigButton>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border-t-2 border-[#0B1F3A]/10 pt-4">
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
          <BigButton tone="call" className="mt-4" onClick={onAdd}>
            {strings.routineAdd}
          </BigButton>
        </div>
      </section>

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
        <h3 className="mb-3 text-xl font-extrabold">{strings.routineRecurring}</h3>
        {recurring.length === 0 ? (
          <p className="text-lg opacity-80">{strings.routineRecurringEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {recurring.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border-2 border-[#0B1F3A]/20 p-3"
              >
                <p className="text-xl font-extrabold">{item.title}</p>
                <p className="text-base text-[#29445e]">
                  {item.time} · {item.days}
                </p>
                <BigButton
                  tone="muted"
                  className="mt-2 min-h-14 text-lg"
                  onClick={() => setItems(removeRoutine(item.id))}
                >
                  {strings.routineRemove}
                </BigButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BigButton href="/talk" tone="primary">
        {strings.routineVoice}
      </BigButton>
    </AppShell>
  );
}
