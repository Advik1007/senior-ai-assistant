"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";

/** Legacy route — redirects into the full setup wizard. */
export default function SetupCallsPage() {
  const router = useRouter();
  const { strings } = useApp();

  useEffect(() => {
    router.replace("/setup/contacts");
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 text-center text-xl font-semibold text-[#0B1F3A]">
      {strings.loading}
    </div>
  );
}
