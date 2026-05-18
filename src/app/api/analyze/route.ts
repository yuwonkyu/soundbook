import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/is-mock";
import { MOCK_BOOK } from "@/lib/mock-data";
import { analyzeSceneEmotions } from "@/lib/analyze";
import { createServerClient } from "@/lib/supabase-server";
import type { Scene } from "@/lib/database.types";

const BATCH_SIZE = 10;

// POST /api/analyze
// Body: { bookId: string, limit?: number }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const bookId = body?.bookId as string | undefined;

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  if (isMockMode()) {
    // Mock data is pre-analyzed — nothing to do
    if (bookId === MOCK_BOOK.id) {
      return NextResponse.json({ analyzed: 0, message: "All scenes already analyzed (mock)" });
    }
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const db = createServerClient();
  const limit = Number(body?.limit) || 50;

  const { data: scenes, error } = await db
    .from("scenes")
    .select("id, text")
    .eq("book_id", bookId)
    .is("analyzed_at", null)
    .order("chapter", { ascending: true })
    .order("order", { ascending: true })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pending = (scenes ?? []) as Pick<Scene, "id" | "text">[];

  if (pending.length === 0) {
    return NextResponse.json({ analyzed: 0, message: "All scenes already analyzed" });
  }

  let analyzed = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    let emotions;
    try {
      emotions = await analyzeSceneEmotions(batch.map((s) => s.text));
    } catch (e) {
      return NextResponse.json(
        { error: `Claude analysis failed at batch ${i}: ${String(e)}`, analyzed },
        { status: 502 }
      );
    }

    const updates = batch.map((scene, idx) => {
      const em = emotions[idx];
      if (!em) return Promise.resolve();
      return db
        .from("scenes")
        .update({
          emotion: em.emotion,
          intensity: em.intensity,
          tags: em.tags,
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", scene.id);
    });

    const results = await Promise.all(updates);
    const failed = results.find((r) => r && "error" in r && r.error);
    if (failed && "error" in failed && failed.error) {
      return NextResponse.json({ error: failed.error.message, analyzed }, { status: 500 });
    }

    analyzed += batch.length;
  }

  return NextResponse.json({ analyzed, total: pending.length });
}
