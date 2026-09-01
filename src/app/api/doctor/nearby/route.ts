import { NextResponse } from "next/server";
import { findNearbyDoctors } from "@/lib/doctor/nearby";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ message: "location_required" }, { status: 400 });
  }

  try {
    const doctors = await findNearbyDoctors(lat, lon);
    return NextResponse.json({ ok: true, doctors });
  } catch {
    return NextResponse.json({ message: "search_failed" }, { status: 500 });
  }
}
