"use client";

import { Suspense } from "react";
import { RoutinePageContent } from "@/components/routine/RoutinePageContent";

export default function RoutinePage() {
  return (
    <Suspense fallback={<div className="p-6 text-xl">…</div>}>
      <RoutinePageContent />
    </Suspense>
  );
}
