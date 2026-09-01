import { NextResponse } from "next/server";
import { generateTalkReply } from "@/lib/ai/talk";
import { isAppLanguage } from "@/lib/languages";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      lang?: string;
      userName?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      memory?: string[];
    };

    const message = body.message?.trim() ?? "";
    if (!message) {
      return NextResponse.json({ message: "empty" }, { status: 400 });
    }

    const lang = body.lang && isAppLanguage(body.lang) ? body.lang : "en";

    const result = await generateTalkReply({
      message,
      lang,
      userName: body.userName?.trim() || "friend",
      history: body.history ?? [],
      memory: body.memory ?? [],
    });

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ message: "talk_failed" }, { status: 500 });
  }
}
