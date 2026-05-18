import { supabase } from "./supabase";
import type { Book, Scene, AudioMapping } from "./database.types";

// ── Books ──────────────────────────────────────────────

export async function getBook(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Book;
}

export async function upsertBook(
  book: Omit<Book, "id" | "created_at">
): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .upsert(book, { onConflict: "gutenberg_id" })
    .select()
    .single();
  if (error) throw error;
  return data as Book;
}

// ── Scenes ─────────────────────────────────────────────

export async function getScenesByBook(bookId: string): Promise<Scene[]> {
  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("book_id", bookId)
    .order("chapter", { ascending: true })
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Scene[];
}

export async function insertScenes(
  scenes: Omit<Scene, "id" | "created_at">[]
): Promise<Scene[]> {
  const { data, error } = await supabase
    .from("scenes")
    .insert(scenes)
    .select();
  if (error) throw error;
  return (data ?? []) as Scene[];
}

export async function updateSceneEmotion(
  sceneId: string,
  emotion: string,
  intensity: number,
  tags: string[]
): Promise<void> {
  const { error } = await supabase
    .from("scenes")
    .update({ emotion, intensity, tags, analyzed_at: new Date().toISOString() })
    .eq("id", sceneId);
  if (error) throw error;
}

// ── Audio Mappings ─────────────────────────────────────

export async function getAudioMapping(
  sceneId: string
): Promise<AudioMapping | null> {
  const { data, error } = await supabase
    .from("audio_mappings")
    .select("*")
    .eq("scene_id", sceneId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as AudioMapping | null;
}

export async function upsertAudioMapping(
  mapping: Omit<AudioMapping, "id" | "created_at">
): Promise<AudioMapping> {
  const { data, error } = await supabase
    .from("audio_mappings")
    .upsert(mapping, { onConflict: "scene_id" })
    .select()
    .single();
  if (error) throw error;
  return data as AudioMapping;
}
