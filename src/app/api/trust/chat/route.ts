import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INFER_URL = process.env.TRUST_AI_INFER_URL ?? "http://127.0.0.1:8742";

type Body = {
  message?: string;
  mode?: "general" | "student";
  timezone?: string;
  prior?: unknown;
  stream?: boolean;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message || "").trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const stream = body.stream !== false;
  const upstream = await fetch(`${INFER_URL}/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      mode: body.mode ?? null,
      timezone: body.timezone || "America/Los_Angeles",
      prior: body.prior ?? null,
      stream,
    }),
    signal: request.signal,
  }).catch((err: unknown) => {
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "Could not reach Trust AI inference server",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return NextResponse.json(
      { error: detail || `Upstream ${upstream.status}` },
      { status: upstream.status === 503 ? 503 : 502 },
    );
  }

  if (!stream) {
    const data = await upstream.json();
    return NextResponse.json(data);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
