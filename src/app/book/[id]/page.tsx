import { notFound } from "next/navigation";
import { isMockMode } from "@/lib/is-mock";
import { mockStore } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import BookReader from "@/components/Reader/BookReader";
import type { Book, Scene, AudioMapping } from "@/lib/database.types";
import type { SceneWithAudio } from "@/components/Reader/SceneBlock";

type Props = { params: Promise<{ id: string }> };

async function fetchBookData(id: string) {
  if (isMockMode()) {
    const book = mockStore.getBook(id);
    if (!book) return null;
    return { book, scenes: mockStore.getScenesWithAudio(id) };
  }

  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, gutenberg_id, title, author, language, created_at")
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

  return { book: book as Book, scenes: scenesWithAudio };
}

export default async function BookPage({ params }: Props) {
  const { id } = await params;
  const data = await fetchBookData(id);

  if (!data) notFound();

  const { book, scenes } = data;

  if (scenes.length === 0) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">이 책의 장면 데이터가 없습니다.</p>
          <a href="/" className="text-purple-400 hover:text-purple-300 text-sm">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <BookReader
      bookId={book.id}
      bookTitle={book.title}
      bookAuthor={book.author}
      scenes={scenes}
    />
  );
}
