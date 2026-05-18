import { NextRequest, NextResponse } from "next/server";
import { analyzeSceneEmotions } from "@/lib/analyze";
import { createServerClient } from "@/lib/supabase-server";
import type { Scene } from "@/lib/database.types";

const BATCH_SIZE = 10; // scenes per Claude call

// POST /api/analyze
// Body: { bookId: string, limit?: number }
// Analyzes unanalyzed scenes for a book in batches
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const bookId = body?.bookId as string | undefined;

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const db = createServerClient();

  // Only fetch scenes that haven't been analyzed yet
  const limit = Number(body?.limit) || 50;
  const { data: scenes, error } = await db
    .from("scenes")
    .select("id, text")
    .eq("book_id", bookId)
    .is("analyzed_at", null)
    .order("chapter", { ascending: true })
    .order("order", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pending = (scenes ?? []) as Pick<Scene, "id" | "text">[];

  if (pending.length === 0) {
    return NextResponse.json({ analyzed: 0, message: "All scenes already analyzed" });
  }

  let analyzed = 0;

  // Process in batches to avoid large prompts
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const passages = batch.map((s) => s.text);

    let emotions;
    try {
      emotions = await analyzeSceneEmotions(passages);
    } catch (e) {
      return NextResponse.json(
        { error: `Claude analysis failed at batch ${i}: ${String(e)}`, analyzed },
        { status: 502 }
      );
    }

    // Update each scene with the returned emotions
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
