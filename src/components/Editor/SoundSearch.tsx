"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FreesoundResult } from "@/lib/freesound";

interface Props {
  initialQuery?: string;
  onSelect: (result: FreesoundResult) => void;
}

export default function SoundSearch({ initialQuery = "", onSelect }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<FreesoundResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/sounds?q=${encodeURIComponent(q)}&pageSize=8`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Trigger search when initialQuery changes (new scene selected)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const togglePreview = (result: FreesoundResult) => {
    const url = result.previews["preview-hq-mp3"];

    if (playingId === result.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingId(result.id);
  };

  const handleSelect = (result: FreesoundResult) => {
    audioRef.current?.pause();
    setPlayingId(null);
    onSelect(result);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-800 shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어 입력 (예: dark ambient rain)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8 text-gray-600 text-sm">
            검색 중…
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="flex items-center justify-center py-8 text-gray-600 text-sm">
            결과 없음
          </div>
        )}

        {!loading && results.length === 0 && !query && (
          <div className="flex items-center justify-center py-8 text-gray-700 text-sm">
            감정 태그 기반 쿼리가 자동 입력됩니다
          </div>
        )}

        <ul className="divide-y divide-gray-800">
          {results.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50">
              <button
                onClick={() => togglePreview(r)}
                className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-colors ${
                  playingId === r.id
                    ? "border-purple-500 bg-purple-900/40 text-purple-300"
                    : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                {playingId === r.id ? "■" : "▶"}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{r.name}</p>
                <p className="text-xs text-gray-600">
                  {Math.round(r.duration)}s · {r.license.split("/").pop()}
                </p>
              </div>

              <button
                onClick={() => handleSelect(r)}
                className="shrink-0 px-3 py-1.5 text-xs bg-cyan-900/50 hover:bg-cyan-800/60 border border-cyan-800 text-cyan-300 rounded-lg transition-colors"
              >
                사용
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
