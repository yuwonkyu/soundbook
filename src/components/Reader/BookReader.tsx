"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import EmotionBadge from "./EmotionBadge";
import type { SceneWithAudio } from "./SceneBlock";

interface Props {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  scenes: SceneWithAudio[];
}

function fadeOut(audio: HTMLAudioElement, ms = 600): Promise<void> {
  return new Promise((resolve) => {
    const steps = 15;
    const interval = ms / steps;
    const startVol = audio.volume;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) { clearInterval(timer); audio.pause(); resolve(); }
    }, interval);
  });
}

function fadeIn(audio: HTMLAudioElement, ms = 600) {
  audio.volume = 0;
  audio.loop = true;
  audio.play().catch(() => {});
  const steps = 15;
  const interval = ms / steps;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    audio.volume = Math.min(1, step / steps);
    if (step >= steps) clearInterval(timer);
  }, interval);
}

export default function BookReader({ bookId, bookTitle, bookAuthor, scenes }: Props) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const scene = scenes[index];
  const total = scenes.length;

  // Play audio for current scene
  const playScene = useCallback(async (s: SceneWithAudio) => {
    const prev = audioRef.current;
    if (prev) await fadeOut(prev);

    if (s.audio?.preview_url) {
      const audio = new Audio(s.audio.preview_url);
      audioRef.current = audio;
      fadeIn(audio);
      setIsPlaying(true);
    } else {
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => { playScene(scene); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((next: number, dir: "left" | "right") => {
    if (next < 0 || next >= total) return;
    setAnimDir(dir);
    setTimeout(() => {
      setIndex(next);
      setAnimDir(null);
    }, 150);
  }, [total]);

  const prev = () => goTo(index - 1, "right");
  const next = () => goTo(index + 1, "left");

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) next();
    if (dx > 50) prev();
    touchStartX.current = null;
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.volume > 0) { audio.volume = 0; setIsPlaying(false); }
    else { audio.volume = 1; setIsPlaying(true); }
  };

  return (
    <div
      className="flex flex-col h-screen bg-gray-950 text-white select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/books" className="text-gray-500 hover:text-white text-sm shrink-0">← 목록</a>
          <span className="text-sm text-gray-300 truncate">{bookTitle}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a href={`/editor/${bookId}`} className="text-xs px-3 py-1.5 bg-purple-800 hover:bg-purple-700 rounded-lg transition-colors">
            에디터
          </a>
          <button onClick={toggleMute} className="text-xs px-3 py-1.5 border border-gray-700 hover:border-gray-500 rounded-lg transition-colors">
            {isPlaying ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {/* Page area */}
      <div className="flex flex-1 min-h-0">

        {/* Left arrow */}
        <button
          onClick={prev}
          disabled={index === 0}
          className="shrink-0 w-16 flex items-center justify-center text-gray-700 hover:text-gray-400 disabled:opacity-20 transition-colors text-2xl"
        >
          ‹
        </button>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Book title on first page */}
          {index === 0 && (
            <div className="pt-10 pb-4 text-center shrink-0">
              <h1 className="text-2xl font-bold">{bookTitle}</h1>
              <p className="text-sm text-gray-500 mt-1">{bookAuthor}</p>
            </div>
          )}

          {/* Chapter label */}
          <div className="shrink-0 px-2 pt-4 pb-2 text-center">
            <span className="text-xs text-gray-600 uppercase tracking-widest">
              Chapter {scene.chapter + 1}
            </span>
          </div>

          {/* Scene text */}
          <div
            className={`flex-1 overflow-y-auto px-4 pb-6 transition-opacity duration-150 ${animDir ? "opacity-0" : "opacity-100"}`}
          >
            <div className="max-w-xl mx-auto">
              {scene.emotion && (
                <div className="flex items-center gap-2 mb-4">
                  <EmotionBadge emotion={scene.emotion} intensity={scene.intensity ?? 0} />
                  {scene.audio && (
                    <span className="text-xs text-gray-600 truncate max-w-xs">♪ {scene.audio.name}</span>
                  )}
                </div>
              )}
              <p className="text-gray-200 leading-loose text-[15px]">{scene.text}</p>
            </div>
          </div>

          {/* Progress bar + page info */}
          <div className="shrink-0 px-4 pb-4">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-700 rounded-full transition-all duration-300"
                    style={{ width: `${((index + 1) / total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 shrink-0">{index + 1} / {total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          disabled={index === total - 1}
          className="shrink-0 w-16 flex items-center justify-center text-gray-700 hover:text-gray-400 disabled:opacity-20 transition-colors text-2xl"
        >
          ›
        </button>
      </div>
    </div>
  );
}
