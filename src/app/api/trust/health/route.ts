import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INFER_URL = process.env.TRUST_AI_INFER_URL ?? "http://127.0.0.1:8742";

export async function GET() {
  try {
    const res = await fetch(`${INFER_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, detail: data?.detail || `Upstream ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        detail:
          err instanceof Error
            ? err.message
            : "Inference server unreachable on 127.0.0.1:8742",
      },
      { status: 503 },
    );
  }
}
