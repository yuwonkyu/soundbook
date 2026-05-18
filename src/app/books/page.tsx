import { isMockMode } from "@/lib/is-mock";
import { MOCK_BOOK, MOCK_SCENES, MOCK_AUDIO_MAPPINGS } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/database.types";

type BookWithStats = {
  id: string;
  title: string;
  author: string;
  language: string;
  created_at: string;
  sceneCount: number;
  analyzedCount: number;
  mappedCount: number;
};

async function fetchBooks(): Promise<BookWithStats[]> {
  if (isMockMode()) {
    return [
      {
        id: MOCK_BOOK.id,
        title: MOCK_BOOK.title,
        author: MOCK_BOOK.author,
        language: MOCK_BOOK.language,
        created_at: MOCK_BOOK.created_at,
        sceneCount: MOCK_SCENES.length,
        analyzedCount: MOCK_SCENES.filter((s) => s.emotion).length,
        mappedCount: MOCK_AUDIO_MAPPINGS.length,
      },
    ];
  }

  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, language, created_at")
    .order("created_at", { ascending: false });

  if (!books?.length) return [];

  const bookList = books as Book[];

  // Get scene stats for all books in one query
  const { data: scenes } = await supabase
    .from("scenes")
    .select("book_id, emotion, id")
    .in("book_id", bookList.map((b) => b.id));

  const { data: mappings } = await supabase
    .from("audio_mappings")
    .select("scene_id");

  const mappedSceneIds = new Set((mappings ?? []).map((m: { scene_id: string }) => m.scene_id));

  return bookList.map((book) => {
    const bookScenes = (scenes ?? []).filter((s: { book_id: string; emotion: string | null; id: string }) => s.book_id === book.id);
    return {
      ...book,
      sceneCount: bookScenes.length,
      analyzedCount: bookScenes.filter((s: { emotion: string | null }) => s.emotion).length,
      mappedCount: bookScenes.filter((s: { id: string }) => mappedSceneIds.has(s.id)).length,
    };
  });
}

export default async function BooksPage() {
  const books = await fetchBooks();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-gray-500 hover:text-white text-sm">← 홈</a>
          <h1 className="text-lg font-semibold">내 책 목록</h1>
        </div>
        <a
          href="/editor"
          className="px-4 py-2 text-sm bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
        >
          + 책 추가
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {books.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-600 mb-6">아직 추가된 책이 없습니다</p>
            <a
              href="/editor"
              className="px-6 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm transition-colors"
            >
              첫 번째 책 추가하기
            </a>
          </div>
        ) : (
          <ul className="space-y-3">
            {books.map((book) => {
              const analyzeProgress = book.sceneCount
                ? Math.round((book.analyzedCount / book.sceneCount) * 100)
                : 0;
              const mapProgress = book.sceneCount
                ? Math.round((book.mappedCount / book.sceneCount) * 100)
                : 0;

              return (
                <li
                  key={book.id}
                  className="rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="font-semibold">{book.title}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a
                          href={`/book/${book.id}`}
                          className="px-3 py-1.5 text-xs border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
                        >
                          읽기
                        </a>
                        <a
                          href={`/editor/${book.id}`}
                          className="px-3 py-1.5 text-xs bg-purple-900/50 hover:bg-purple-800/60 border border-purple-800 text-purple-300 rounded-lg transition-colors"
                        >
                          에디터
                        </a>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-800/50 rounded-lg py-2">
                        <p className="text-lg font-bold">{book.sceneCount}</p>
                        <p className="text-xs text-gray-500">장면</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg py-2">
                        <p className="text-lg font-bold text-yellow-400">{analyzeProgress}%</p>
                        <p className="text-xs text-gray-500">감정 분석</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg py-2">
                        <p className="text-lg font-bold text-cyan-400">{mapProgress}%</p>
                        <p className="text-xs text-gray-500">오디오 매핑</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
