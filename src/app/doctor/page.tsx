import { Suspense } from "react";
import { DoctorPageContent } from "@/components/DoctorPageContent";

export default function DoctorPage() {
  return (
    <Suspense fallback={null}>
      <DoctorPageContent />
    </Suspense>
  );
}
