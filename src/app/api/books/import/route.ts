import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/is-mock";
import { MOCK_BOOK } from "@/lib/mock-data";
import { loadGutenbergBook } from "@/lib/gutenberg";
import { createServerClient } from "@/lib/supabase-server";
import type { Book, Scene } from "@/lib/database.types";

// POST /api/books/import
// Body: { gutenbergId: number }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const gutenbergId = Number(body?.gutenbergId);

  if (!gutenbergId || isNaN(gutenbergId)) {
    return NextResponse.json({ error: "gutenbergId is required" }, { status: 400 });
  }

  if (isMockMode()) {
    return NextResponse.json({
      bookId: MOCK_BOOK.id,
      title: MOCK_BOOK.title,
      author: MOCK_BOOK.author,
      sceneCount: 10,
      mock: true,
    });
  }

  const db = createServerClient();

  const { data: existing } = await db
    .from("books")
    .select("id")
    .eq("gutenberg_id", gutenbergId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ bookId: existing.id, cached: true });
  }

  let parsed;
  try {
    parsed = await loadGutenbergBook(gutenbergId);
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to fetch from Gutenberg: ${String(e)}` },
      { status: 502 }
    );
  }

  const { data: book, error: bookErr } = await db
    .from("books")
    .insert({
      gutenberg_id: parsed.gutenbergId,
      title: parsed.title,
      author: parsed.author,
      language: parsed.language,
      raw_text: parsed.chapters.map((c) => c.passages.join("\n\n")).join("\n\n"),
    })
    .select()
    .single();

  if (bookErr) {
    return NextResponse.json({ error: bookErr.message }, { status: 500 });
  }

  const bookRow = book as Book;

  const scenes: Omit<Scene, "id" | "created_at">[] = parsed.chapters.flatMap(
    (chapter) =>
      chapter.passages.map((text, passageIdx) => ({
        book_id: bookRow.id,
        chapter: chapter.index,
        order: passageIdx,
        text,
        emotion: null,
        intensity: null,
        tags: null,
        analyzed_at: null,
      }))
  );

  const BATCH = 200;
  for (let i = 0; i < scenes.length; i += BATCH) {
    const { error } = await db.from("scenes").insert(scenes.slice(i, i + BATCH));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    bookId: bookRow.id,
    title: bookRow.title,
    author: bookRow.author,
    sceneCount: scenes.length,
  });
}
