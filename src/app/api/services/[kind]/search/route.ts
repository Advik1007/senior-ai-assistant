import { NextResponse } from "next/server";
import { getProvider, serviceErrorResponse } from "@/lib/services/registry";

export async function POST(
  request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  const { kind } = await context.params;
  const provider = getProvider(kind);
  if (!provider) {
    return NextResponse.json({ message: "Unknown service" }, { status: 404 });
  }

  const body = (await request.json()) as { details?: Record<string, string> };
  try {
    const quotes = await provider.search(body.details ?? {});
    return NextResponse.json({ status: "ok", quotes });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
