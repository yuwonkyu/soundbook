import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Book, Scene, AudioMapping } from "@/lib/database.types";

type SceneWithAudio = Scene & { audio: AudioMapping | null };

// GET /api/books/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, gutenberg_id, title, author, language, created_at")
    .eq("id", id)
    .single();

  if (bookErr || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const { data: scenes, error: scenesErr } = await supabase
    .from("scenes")
    .select("*")
    .eq("book_id", id)
    .order("chapter", { ascending: true })
    .order("order", { ascending: true });

  if (scenesErr) {
    return NextResponse.json({ error: scenesErr.message }, { status: 500 });
  }

  const sceneList = (scenes ?? []) as Scene[];

  // Fetch audio mappings for all scenes in one query
  const sceneIds = sceneList.map((s) => s.id);
  const { data: mappings } = await supabase
    .from("audio_mappings")
    .select("*")
    .in("scene_id", sceneIds);

  const mappingByScene = new Map<string, AudioMapping>(
    ((mappings ?? []) as AudioMapping[]).map((m) => [m.scene_id, m])
  );

  const scenesWithAudio: SceneWithAudio[] = sceneList.map((s) => ({
    ...s,
    audio: mappingByScene.get(s.id) ?? null,
  }));

  return NextResponse.json({
    book: book as Book,
    scenes: scenesWithAudio,
  });
}
