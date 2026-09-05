import { NextResponse } from "next/server";
import { diagnoseSymptoms } from "@/lib/doctor/diagnose";
import type { TriageInput } from "@/lib/doctor/triage-engine";
import { isAppLanguage } from "@/lib/languages";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TriageInput & { lang?: string };
    const symptomsText = body.symptomsText?.trim() ?? "";

    if (symptomsText.length < 3 && (body.selectedSymptoms?.length ?? 0) === 0) {
      return NextResponse.json(
        { message: "symptoms_required" },
        { status: 400 },
      );
    }

    const input: TriageInput = {
      symptomsText,
      duration: body.duration ?? "days",
      severity: Math.min(10, Math.max(1, Number(body.severity) || 5)),
      ageGroup: body.ageGroup ?? "65plus",
      selectedSymptoms: body.selectedSymptoms ?? [],
      lang: body.lang && isAppLanguage(body.lang) ? body.lang : "en",
    };

    const result = await diagnoseSymptoms({
      ...input,
      lang: input.lang ?? "en",
    });

    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ message: "analysis_failed" }, { status: 500 });
  }
}
