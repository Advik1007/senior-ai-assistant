"use client";

import type { AppStrings } from "@/lib/i18n/nested";
import {
  eventCountsInMonth,
  toDateKey,
} from "@/lib/storage/routines";
import type { RoutineItem } from "@/lib/storage/routines";

type Props = {
  strings: AppStrings;
  items: RoutineItem[];
  viewYear: number;
  viewMonth: number; // 0–11
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (year: number, month: number) => void;
};

function buildCells(year: number, month: number): Array<number | null> {
  const first = new Date(year, month, 1);
  const startPad = first.getDay(); // 0 = Sun
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function RoutineCalendar({
  strings,
  items,
  viewYear,
  viewMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: Props) {
  const counts = eventCountsInMonth(items, viewYear, viewMonth);
  const cells = buildCells(viewYear, viewMonth);
  const todayKey = toDateKey(new Date());
  const title = `${strings.routineMonths[viewMonth]} ${viewYear}`;

  function goPrev() {
    if (viewMonth === 0) onChangeMonth(viewYear - 1, 11);
    else onChangeMonth(viewYear, viewMonth - 1);
  }

  function goNext() {
    if (viewMonth === 11) onChangeMonth(viewYear + 1, 0);
    else onChangeMonth(viewYear, viewMonth + 1);
  }

  function goToday() {
    const now = new Date();
    onChangeMonth(now.getFullYear(), now.getMonth());
    onSelectDate(toDateKey(now));
  }

  return (
    <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="min-h-12 min-w-12 rounded-xl border-2 border-[#0B1F3A]/30 px-3 text-2xl font-bold"
          aria-label={strings.routinePrevMonth}
        >
          ‹
        </button>
        <h2 className="text-center text-2xl font-extrabold text-[#0B1F3A]">
          {title}
        </h2>
        <button
          type="button"
          onClick={goNext}
          className="min-h-12 min-w-12 rounded-xl border-2 border-[#0B1F3A]/30 px-3 text-2xl font-bold"
          aria-label={strings.routineNextMonth}
        >
          ›
        </button>
      </div>

      <button
        type="button"
        onClick={goToday}
        className="mb-3 w-full rounded-xl bg-[#0B4F8A] px-4 py-3 text-lg font-bold text-white"
      >
        {strings.routineToday}
      </button>

      <div className="grid grid-cols-7 gap-1 text-center text-sm font-bold text-[#29445e]">
        {strings.routineWeekdays.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`e-${idx}`} className="min-h-14" />;
          }
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const selected = key === selectedDate;
          const isToday = key === todayKey;
          const count = counts[day] ?? 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`relative flex min-h-14 flex-col items-center justify-center rounded-xl border-2 text-lg font-bold transition ${
                selected
                  ? "border-[#0B4F8A] bg-[#0B4F8A] text-white"
                  : isToday
                    ? "border-[#0B4F8A] bg-[#E8F1FA] text-[#0B1F3A]"
                    : "border-transparent bg-[#F7F4EE] text-[#0B1F3A]"
              }`}
            >
              {day}
              {count > 0 ? (
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    selected ? "bg-white" : "bg-[#0B4F8A]"
                  }`}
                  aria-hidden
                />
              ) : (
                <span className="mt-0.5 h-1.5 w-1.5" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
