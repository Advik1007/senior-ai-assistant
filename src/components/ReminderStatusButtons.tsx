"use client";

import { useSyncExternalStore } from "react";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import {
  getReminderStatus,
  setReminderStatus,
  type ReminderKind,
  type ReminderStatus,
} from "@/lib/storage/reminder-completions";
import { subscribeStore } from "@/lib/storage/store-events";

type Props = {
  kind: ReminderKind;
  id: string;
  className?: string;
};

export function ReminderStatusButtons({ kind, id, className }: Props) {
  const { strings } = useApp();
  const status = useSyncExternalStore(
    subscribeStore,
    () => getReminderStatus(kind, id),
    () => null,
  );

  function update(next: ReminderStatus) {
    setReminderStatus(kind, id, next);
  }

  if (status === "taken") {
    return (
      <p className={`text-xl font-bold text-green-800 ${className ?? ""}`}>
        {strings.remindersStatusTaken}
      </p>
    );
  }

  if (status === "skipped") {
    return (
      <p className={`text-xl font-bold text-amber-900 ${className ?? ""}`}>
        {strings.remindersStatusSkipped}
      </p>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${className ?? ""}`}>
      <BigButton
        tone="call"
        className="min-h-16 text-lg"
        onClick={() => update("taken")}
      >
        {strings.remindersTaken}
      </BigButton>
      <BigButton
        tone="muted"
        className="min-h-16 text-lg"
        onClick={() => update("skipped")}
      >
        {strings.remindersNotTaken}
      </BigButton>
    </div>
  );
}
