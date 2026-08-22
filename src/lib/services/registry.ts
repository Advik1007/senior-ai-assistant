import { NextResponse } from "next/server";
import { billService } from "@/lib/services/bills";
import { bloodTestService } from "@/lib/services/blood-test";
import { cabService } from "@/lib/services/cab";
import { flightService } from "@/lib/services/flight";
import { nurseService } from "@/lib/services/nurse";
import { ServiceNotConnectedError, type BookingProvider } from "@/lib/services/types";

const providers: Record<string, BookingProvider> = {
  cab: cabService,
  flight: flightService,
  bills: billService,
  nurse: nurseService,
  "blood-test": bloodTestService,
};

export function getProvider(kind: string): BookingProvider | null {
  return providers[kind] ?? null;
}

export function serviceErrorResponse(error: unknown) {
  if (error instanceof ServiceNotConnectedError) {
    return NextResponse.json(
      {
        status: "api_connection_required",
        message: error.message,
        quotes: [],
      },
      { status: 501 },
    );
  }
  return NextResponse.json(
    { status: "failed", message: "The service could not run.", quotes: [] },
    { status: 500 },
  );
}
