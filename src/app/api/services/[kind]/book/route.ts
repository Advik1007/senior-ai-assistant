import { NextResponse } from "next/server";
import { getProvider, serviceErrorResponse } from "@/lib/services/registry";

/**
 * Books only after the client has collected two user confirmations.
 * Still refuses if the provider is not connected or returns no id.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  const { kind } = await context.params;
  const provider = getProvider(kind);
  if (!provider) {
    return NextResponse.json({ message: "Unknown service" }, { status: 404 });
  }

  const body = (await request.json()) as {
    quoteId?: string;
    firstConfirmed?: boolean;
    secondConfirmed?: boolean;
  };

  if (!body.firstConfirmed || !body.secondConfirmed) {
    return NextResponse.json(
      { status: "rejected", message: "Two confirmations are required." },
      { status: 400 },
    );
  }
  if (!body.quoteId) {
    return NextResponse.json(
      { status: "rejected", message: "No ride or service was selected." },
      { status: 400 },
    );
  }

  try {
    const result = await provider.book(body.quoteId);
    if (!result.confirmationId) {
      return NextResponse.json(
        { status: "failed", message: "Provider did not confirm." },
        { status: 502 },
      );
    }
    return NextResponse.json({
      status: "confirmed",
      confirmationId: result.confirmationId,
    });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
