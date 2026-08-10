import { NextRequest, NextResponse } from "next/server";
import { newId, savePng } from "@/lib/store";

export const runtime = "nodejs";

// Accepts { dataUrl } (PNG data URL) and stores it, returning an id.
export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = await req.json();
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "expected a PNG data URL" }, { status: 400 });
    }
    const base64 = dataUrl.slice("data:image/png;base64,".length);
    const bytes = Buffer.from(base64, "base64");
    // guard against absurd payloads (~8MB)
    if (bytes.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "image too large" }, { status: 413 });
    }
    const id = newId();
    await savePng(id, bytes);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
