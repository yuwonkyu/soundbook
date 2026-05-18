import { NextRequest, NextResponse } from "next/server";
import { searchSounds } from "@/lib/freesound";

// GET /api/sounds?q=<query>&pageSize=<n>
// Proxies Freesound API so the key stays server-side
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "5"), 20);

  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  try {
    const results = await searchSounds(q, { pageSize });
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
