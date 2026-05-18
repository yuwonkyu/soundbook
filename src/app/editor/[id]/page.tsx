import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AudioEditor from "@/components/Editor/AudioEditor";
import type { Book, Scene, AudioMapping } from "@/lib/database.types";
import type { SceneWithAudio } from "@/components/Reader/SceneBlock";

type Props = { params: Promise<{ id: string }> };

async function fetchEditorData(id: string) {
  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, title, author")
    .eq("id", id)
    .single();

  if (bookErr || !book) return null;

  const { data: scenes } = await supabase
    .from("scenes")
    .select("*")
    .eq("book_id", id)
    .order("chapter", { ascending: true })
    .order("order", { ascending: true });

  const sceneList = (scenes ?? []) as Scene[];
  const sceneIds = sceneList.map((s) => s.id);

  const { data: mappings } = await supabase
    .from("audio_mappings")
    .select("*")
    .in("scene_id", sceneIds.length > 0 ? sceneIds : ["__none__"]);

  const mappingMap = new Map<string, AudioMapping>(
    ((mappings ?? []) as AudioMapping[]).map((m) => [m.scene_id, m])
  );

  const scenesWithAudio: SceneWithAudio[] = sceneList.map((s) => ({
    ...s,
    audio: mappingMap.get(s.id) ?? null,
  }));

  return { book: book as Pick<Book, "id" | "title" | "author">, scenes: scenesWithAudio };
}

export default async function EditorPage({ params }: Props) {
  const { id } = await params;
  const data = await fetchEditorData(id);

  if (!data) notFound();

  const { book, scenes } = data;

  return (
    <AudioEditor
      bookId={book.id}
      bookTitle={book.title}
      scenes={scenes}
    />
  );
}
