import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const FILENAME = "unk-ai-release.apk";

/**
 * Forces an APK download with correct MIME + Content-Disposition.
 * Prefer linking to /downloads/unk-ai-release.apk (static); this route
 * is a reliable fallback for browsers that ignore static attachment headers.
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "downloads", FILENAME);

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${FILENAME}"`,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Release APK not found. Place public/downloads/unk-ai-release.apk" },
      { status: 404 },
    );
  }
}
