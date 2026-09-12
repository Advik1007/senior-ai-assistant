"use client";

import { useSyncExternalStore } from "react";
import { ReminderStatusButtons } from "@/components/ReminderStatusButtons";
import { useApp } from "@/components/providers/app-provider";
import { loadMedicalProfile } from "@/lib/storage/medical-profile";
import { loadRoutines } from "@/lib/storage/routines";
import { subscribeStore } from "@/lib/storage/store-events";

export function TodayReminders() {
  const { strings } = useApp();
  useSyncExternalStore(subscribeStore, () => Date.now(), () => 0);

  const medicines = loadMedicalProfile().medicines;
  const routines = loadRoutines();
  const hasItems = medicines.length > 0 || routines.length > 0;

  if (!hasItems) {
    return (
      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
        <h2 className="text-2xl font-extrabold">{strings.remindersTodayTitle}</h2>
        <p className="mt-2 text-xl opacity-80">{strings.remindersNone}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
      <h2 className="text-2xl font-extrabold">{strings.remindersTodayTitle}</h2>

      {medicines.length > 0 ? (
        <div className="mt-4 space-y-4">
          <p className="text-lg font-bold uppercase tracking-wide opacity-70">
            {strings.remindersMedicine}
          </p>
          {medicines.map((med) => (
            <article
              key={med.id}
              className="rounded-2xl border-2 border-[#0B1F3A]/20 p-3"
            >
              <p className="text-xl font-extrabold">
                {med.name || strings.medicalMedicineName}
              </p>
              <p className="text-lg">
                {med.time || strings.routineAnytime}
                {med.dose ? ` · ${med.dose}` : ""}
              </p>
              <ReminderStatusButtons kind="medicine" id={med.id} className="mt-3" />
            </article>
          ))}
        </div>
      ) : null}

      {routines.length > 0 ? (
        <div className="mt-4 space-y-4">
          <p className="text-lg font-bold uppercase tracking-wide opacity-70">
            {strings.remindersRoutine}
          </p>
          {routines.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border-2 border-[#0B1F3A]/20 p-3"
            >
              <p className="text-xl font-extrabold">{item.title}</p>
              <p className="text-lg">
                {item.time || strings.routineAnytime} · {item.days || strings.routineDaily}
              </p>
              <ReminderStatusButtons kind="routine" id={item.id} className="mt-3" />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
