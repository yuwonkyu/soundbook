"use client";

import { useRef, useState, useCallback } from "react";
import SceneBlock, { type SceneWithAudio } from "./SceneBlock";

interface Props {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  scenes: SceneWithAudio[];
}

function fadeOut(audio: HTMLAudioElement, ms = 800): Promise<void> {
  return new Promise((resolve) => {
    const steps = 20;
    const interval = ms / steps;
    const startVol = audio.volume;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(timer);
        audio.pause();
        resolve();
      }
    }, interval);
  });
}

function fadeIn(audio: HTMLAudioElement, ms = 800) {
  audio.volume = 0;
  audio.loop = true;
  audio.play().catch(() => {}); // browser may block autoplay before first interaction
  const steps = 20;
  const interval = ms / steps;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    audio.volume = Math.min(1, step / steps);
    if (step >= steps) clearInterval(timer);
  }, interval);
}

// Group consecutive scenes by chapter for visual separation
function groupByChapter(scenes: SceneWithAudio[]) {
  const chapters = new Map<number, SceneWithAudio[]>();
  for (const scene of scenes) {
    const ch = scene.chapter;
    if (!chapters.has(ch)) chapters.set(ch, []);
    chapters.get(ch)!.push(scene);
  }
  return [...chapters.entries()].sort(([a], [b]) => a - b);
}

export default function BookReader({ bookId, bookTitle, bookAuthor, scenes }: Props) {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeIdRef = useRef<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleSceneEnter = useCallback(async (scene: SceneWithAudio) => {
    if (scene.id === activeIdRef.current) return;
    activeIdRef.current = scene.id;
    setActiveSceneId(scene.id);

    const prev = activeAudioRef.current;
    if (prev) await fadeOut(prev);

    if (scene.audio?.preview_url) {
      const audio = new Audio(scene.audio.preview_url);
      activeAudioRef.current = audio;
      fadeIn(audio);
      setIsPlaying(true);
    } else {
      activeAudioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = () => {
    const audio = activeAudioRef.current;
    if (!audio) return;
    if (audio.volume > 0) {
      audio.volume = 0;
      setIsPlaying(false);
    } else {
      audio.volume = 1;
      setIsPlaying(true);
    }
  };

  const chapters = groupByChapter(scenes);
  const analyzedCount = scenes.filter((s) => s.emotion).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Fixed top bar */}
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" className="text-gray-500 hover:text-white text-sm shrink-0">←</a>
          <span className="text-sm text-gray-300 truncate">{bookTitle}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {analyzedCount < scenes.length && (
            <span className="text-xs text-yellow-600">
              분석 {analyzedCount}/{scenes.length}
            </span>
          )}
          <a
            href={`/editor/${bookId}`}
            className="text-xs px-3 py-1.5 bg-purple-800 hover:bg-purple-700 rounded-lg transition-colors"
          >
            에디터
          </a>
          <button
            onClick={toggleMute}
            className="text-xs px-3 py-1.5 border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            {isPlaying ? "🔊 소리 끄기" : "🔇 소리 켜기"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">{bookTitle}</h1>
          <p className="text-gray-500">{bookAuthor}</p>
        </div>

        {chapters.map(([chapterIndex, chapterScenes]) => (
          <section key={chapterIndex} className="mb-12">
            {chapterIndex > 0 && (
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-6">
                Chapter {chapterIndex + 1}
              </h2>
            )}
            <div className="space-y-4">
              {chapterScenes.map((scene) => (
                <SceneBlock
                  key={scene.id}
                  scene={scene}
                  isActive={scene.id === activeSceneId}
                  onEnter={handleSceneEnter}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
