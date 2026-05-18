"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isMockMode } from "@/lib/is-mock";
import { MOCK_BOOK } from "@/lib/mock-data";

const SAMPLE_BOOKS = [
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen" },
  { id: 11,   title: "Alice's Adventures in Wonderland", author: "Lewis Carroll" },
  { id: 84,   title: "Frankenstein", author: "Mary Shelley" },
  { id: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle" },
  { id: 2701, title: "Moby Dick", author: "Herman Melville" },
  { id: 345,  title: "Dracula", author: "Bram Stoker" },
];

export default function EditorIndexPage() {
  const router = useRouter();
  const [gutenbergId, setGutenbergId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async (id?: number) => {
    const targetId = id ?? Number(gutenbergId);
    if (!targetId) return;

    if (isMockMode()) {
      // Mock mode: 목 데이터 책으로 이동
      router.push(`/editor/${MOCK_BOOK.id}`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gutenbergId: targetId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push(`/editor/${data.bookId}`);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <a href="/" className="text-gray-500 hover:text-white text-sm">← 홈</a>
        <h1 className="text-lg font-semibold">오디오 에디터</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">

        {/* Gutenberg ID 직접 입력 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Project Gutenberg에서 불러오기
          </h2>
          <div className="flex gap-3">
            <input
              type="number"
              value={gutenbergId}
              onChange={(e) => setGutenbergId(e.target.value)}
              placeholder="Gutenberg 책 번호 입력 (예: 1342)"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-600 placeholder-gray-600"
            />
            <button
              onClick={() => handleImport()}
              disabled={loading || !gutenbergId}
              className="px-6 py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "불러오는 중…" : "불러오기"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          {isMockMode() && (
            <p className="mt-2 text-xs text-yellow-700">
              현재 목 데이터 모드 — Supabase 연결 전까지 샘플 책으로 이동합니다
            </p>
          )}
        </section>

        {/* 샘플 책 목록 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            샘플 책 바로 열기
          </h2>
          <ul className="space-y-2">
            {SAMPLE_BOOKS.map((book) => (
              <li key={book.id}>
                <button
                  onClick={() => handleImport(book.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors text-left disabled:opacity-40"
                >
                  <div>
                    <p className="font-medium text-sm">{book.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{book.author} · #{book.id}</p>
                  </div>
                  <span className="text-gray-600 text-sm">열기 →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

      </main>
    </div>
  );
}
