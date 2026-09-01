"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { useApp } from "@/components/providers/app-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TriageResult } from "@/lib/doctor/triage-engine";

type NearbyDoctor = {
  name: string;
  address: string;
  distanceKm: number | null;
  mapsUrl: string;
};

const SYMPTOM_CHIPS = [
  "fever",
  "headache",
  "cough",
  "chest pain",
  "dizziness",
  "stomach pain",
];

export function DoctorPageContent() {
  const searchParams = useSearchParams();
  const { strings, lang, profile } = useApp();
  const [symptoms, setSymptoms] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState(5);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [doctors, setDoctors] = useState<NearbyDoctor[]>([]);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  function toggleChip(chip: string) {
    setSelected((list) =>
      list.includes(chip) ? list.filter((c) => c !== chip) : [...list, chip],
    );
  }

  const analyze = useCallback(async () => {
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch("/api/doctor/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptomsText: symptoms,
          selectedSymptoms: selected,
          severity,
          lang,
          ageGroup: "65plus",
          duration: "days",
        }),
      });
      const data = (await res.json()) as { result?: TriageResult };
      if (data.result) setResult(data.result);
    } finally {
      setAnalyzing(false);
    }
  }, [symptoms, selected, severity, lang]);

  const findNearby = useCallback(() => {
    setLocating(true);
    setLocError("");
    setDoctors([]);

    if (!navigator.geolocation) {
      setLocError(strings.doctorLocationUnsupported);
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/doctor/nearby?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as { doctors?: NearbyDoctor[] };
          setDoctors(data.doctors ?? []);
          if (!data.doctors?.length) {
            setLocError(strings.doctorNoneFound);
          }
        } catch {
          setLocError(strings.doctorSearchFailed);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocError(strings.doctorLocationDenied);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 15000 },
    );
  }, [strings]);

  useEffect(() => {
    if (searchParams.get("nearby") === "1") {
      findNearby();
    }
  }, [searchParams, findNearby]);

  const urgencyColor =
    result?.urgency === "emergency"
      ? "bg-[#b00020] text-white"
      : result?.urgency === "urgent"
        ? "bg-[#e65100] text-white"
        : "bg-[#0B4F8A] text-white";

  return (
    <AppShell title={strings.doctorTitle}>
      <p className="text-lg leading-relaxed text-[#29445e]">{strings.doctorIntro}</p>
      <p className="rounded-2xl bg-[#FFF4CC] p-3 text-base font-semibold">
        {strings.notMedicalAdvice}
      </p>

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2 text-2xl font-extrabold">
          <Stethoscope className="size-7" aria-hidden />
          {strings.doctorSymptomsTitle}
        </h2>
        <Label className="text-lg">{strings.doctorDescribe}</Label>
        <Textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder={strings.doctorSymptomPlaceholder}
          className="mt-1 min-h-24 rounded-xl border-2 text-xl md:text-xl"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {SYMPTOM_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => toggleChip(chip)}
              className={`rounded-full border-2 px-4 py-2 text-lg font-semibold ${
                selected.includes(chip)
                  ? "border-[#0B4F8A] bg-[#0B4F8A] text-white"
                  : "border-[#0B1F3A]/30 bg-white"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
        <Label className="mt-4 text-lg">
          {strings.doctorSeverity} ({severity}/10)
        </Label>
        <Input
          type="range"
          min={1}
          max={10}
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
          className="mt-2 h-4 w-full"
        />
        <BigButton tone="primary" className="mt-4" onClick={analyze} disabled={analyzing}>
          {analyzing ? strings.doctorAnalyzing : strings.doctorAnalyze}
        </BigButton>
      </section>

      {result ? (
        <section className="flex flex-col gap-4 rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
          <div className={`rounded-2xl p-4 text-xl font-bold ${urgencyColor}`}>
            {strings.doctorUrgency}: {result.urgency.toUpperCase()}
            <p className="mt-2 text-base font-semibold">{result.urgencyReason}</p>
          </div>
          <p className="text-lg">{result.clinicalSummary}</p>
          <h3 className="text-xl font-extrabold">{strings.doctorPossible}</h3>
          <ul className="space-y-3">
            {result.differentials.map((d) => (
              <li
                key={d.condition}
                className="rounded-2xl border-2 border-[#0B1F3A]/20 p-3"
              >
                <p className="text-lg font-bold">
                  {d.condition}{" "}
                  <span className="text-[#0B4F8A]">({d.probability}%)</span>
                </p>
                <p className="text-base text-[#29445e]">{d.explanation}</p>
              </li>
            ))}
          </ul>
          <h3 className="text-xl font-extrabold">{strings.doctorNextSteps}</h3>
          <ul className="list-disc space-y-2 pl-6 text-lg">
            {result.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border-4 border-[#0B1F3A] bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2 text-2xl font-extrabold">
          <MapPin className="size-7" aria-hidden />
          {strings.doctorNearbyTitle}
        </h2>
        <p className="mb-4 text-lg text-[#29445e]">{strings.doctorNearbyHint}</p>
        <BigButton tone="call" onClick={findNearby} disabled={locating}>
          {locating ? strings.doctorFinding : strings.doctorFindNearby}
        </BigButton>
        {locError ? (
          <p className="mt-3 text-lg font-semibold text-[#b00020]">{locError}</p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {doctors.map((doc) => (
            <li
              key={`${doc.name}-${doc.address}`}
              className="rounded-2xl border-2 border-[#0B1F3A]/20 p-4"
            >
              <p className="text-xl font-bold">{doc.name}</p>
              <p className="text-base text-[#29445e]">{doc.address}</p>
              {doc.distanceKm != null ? (
                <p className="mt-1 text-base font-semibold text-[#0B4F8A]">
                  ~{doc.distanceKm.toFixed(1)} km
                </p>
              ) : null}
              <a
                href={doc.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#146c2e] px-4 text-lg font-bold text-white"
              >
                {strings.doctorOpenMaps}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {profile.displayName ? (
        <p className="text-center text-base text-[#60758a]">
          {strings.doctorForUser.replace("{name}", profile.displayName)}
        </p>
      ) : null}
    </AppShell>
  );
}
