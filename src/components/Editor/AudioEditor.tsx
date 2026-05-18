"use client";

import { useState, useCallback } from "react";
import SceneList from "./SceneList";
import SoundSearch from "./SoundSearch";
import EmotionBadge from "@/components/Reader/EmotionBadge";
import type { SceneWithAudio } from "@/components/Reader/SceneBlock";
import type { FreesoundResult } from "@/lib/freesound";
import type { AudioMapping } from "@/lib/database.types";

interface Props {
  bookId: string;
  bookTitle: string;
  scenes: SceneWithAudio[];
}

function buildAutoQuery(scene: SceneWithAudio): string {
  const emotionMap: Record<string, string> = {
    tension:    "suspense tense ambient",
    joy:        "happy uplifting bright",
    melancholy: "sad melancholic piano",
    fear:       "horror dark scary",
    calm:       "peaceful ambient nature",
    mystery:    "mysterious eerie atmosphere",
    romance:    "romantic soft gentle",
  };
  const base = scene.emotion ? (emotionMap[scene.emotion] ?? scene.emotion) : "";
  const tags = (scene.tags ?? []).slice(0, 2).join(" ");
  return `${base} ${tags}`.trim();
}

export default function AudioEditor({ bookId, bookTitle, scenes: initial }: Props) {
  const [scenes, setScenes] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");

  const selectedScene = scenes.find((s) => s.id === selectedId) ?? null;
  const unanalyzedCount = scenes.filter((s) => !s.emotion).length;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeMsg("분석 중…");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, limit: 50 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalyzeMsg(`✓ ${data.analyzed}개 장면 분석 완료. 새로고침하면 결과가 반영됩니다.`);
    } catch (e) {
      setAnalyzeMsg(`오류: ${String(e)}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSoundSelect = useCallback(
    async (result: FreesoundResult) => {
      if (!selectedId) return;

      // Optimistic update
      const mapping: AudioMapping = {
        id: "",
        scene_id: selectedId,
        freesound_id: result.id,
        name: result.name,
        preview_url: result.previews["preview-hq-mp3"],
        duration: result.duration,
        license: result.license,
        query: "",
        is_manual: true,
        created_at: new Date().toISOString(),
      };
      setScenes((prev) =>
        prev.map((s) => (s.id === selectedId ? { ...s, audio: mapping } : s))
      );

      await fetch("/api/audio-mappings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneId: selectedId,
          freesoundId: result.id,
          name: result.name,
          previewUrl: result.previews["preview-hq-mp3"],
          duration: result.duration,
          license: result.license,
          query: selectedScene ? buildAutoQuery(selectedScene) : "",
        }),
      });
    },
    [selectedId, selectedScene]
  );

  const handleRemoveMapping = async () => {
    if (!selectedId) return;
    setScenes((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, audio: null } : s))
    );
    await fetch(`/api/audio-mappings?sceneId=${selectedId}`, { method: "DELETE" });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" className="text-gray-500 hover:text-white text-sm">←</a>
          <span className="text-sm font-medium truncate">{bookTitle}</span>
          <span className="text-xs text-gray-600 hidden sm:block">에디터</span>
        </div>
        <div className="flex items-center gap-3">
          {analyzeMsg && (
            <span className="text-xs text-gray-400 hidden md:block max-w-xs truncate">
              {analyzeMsg}
            </span>
          )}
          {unanalyzedCount > 0 && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="text-xs px-3 py-1.5 bg-yellow-900/50 hover:bg-yellow-800/60 border border-yellow-800 text-yellow-300 rounded-lg disabled:opacity-50 transition-colors"
            >
              {analyzing ? "분석 중…" : `AI 분석 (${unanalyzedCount}개 미분석)`}
            </button>
          )}
          <a
            href={`/book/${bookId}`}
            className="text-xs px-3 py-1.5 border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            리더로 이동
          </a>
        </div>
      </header>

      {/* Main two-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Scene list */}
        <aside className="w-80 shrink-0 border-r border-gray-800 overflow-hidden">
          <SceneList
            scenes={scenes}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        {/* Right: Detail + Search */}
        <main className="flex-1 flex flex-col min-w-0">
          {selectedScene ? (
            <>
              {/* Selected scene info */}
              <div className="shrink-0 p-5 border-b border-gray-800">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedScene.emotion ? (
                      <EmotionBadge
                        emotion={selectedScene.emotion}
                        intensity={selectedScene.intensity ?? 0}
                      />
                    ) : (
                      <span className="text-xs text-gray-500">감정 미분석</span>
                    )}
                    {selectedScene.audio && (
                      <span className="text-xs text-cyan-600">
                        현재: {selectedScene.audio.name}
                      </span>
                    )}
                  </div>
                  {selectedScene.audio && (
                    <button
                      onClick={handleRemoveMapping}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      매핑 삭제
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                  {selectedScene.text}
                </p>
              </div>

              {/* Sound search */}
              <div className="flex-1 min-h-0">
                <SoundSearch
                  key={selectedScene.id}
                  initialQuery={buildAutoQuery(selectedScene)}
                  onSelect={handleSoundSelect}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-700">
              <div className="text-center">
                <p className="text-4xl mb-3">←</p>
                <p className="text-sm">왼쪽에서 장면을 선택하세요</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
