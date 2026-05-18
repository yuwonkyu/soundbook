"use client";

import { useRef, useEffect, memo } from "react";
import EmotionBadge from "./EmotionBadge";
import type { Scene, AudioMapping } from "@/lib/database.types";

export type SceneWithAudio = Scene & { audio: AudioMapping | null };

interface Props {
  scene: SceneWithAudio;
  isActive: boolean;
  onEnter: (scene: SceneWithAudio) => void;
}

function SceneBlock({ scene, isActive, onEnter }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Stable ref to always call the latest onEnter without reconnecting the observer
  const onEnterRef = useRef(onEnter);
  useEffect(() => { onEnterRef.current = onEnter; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onEnterRef.current(scene);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [scene]); // re-observe only if the scene object itself changes

  return (
    <div
      ref={ref}
      className={`p-6 rounded-xl border transition-all duration-500 ${
        isActive
          ? "border-purple-700/60 bg-gray-900 shadow-[0_0_20px_rgba(147,51,234,0.1)]"
          : "border-gray-800 bg-gray-950"
      }`}
    >
      {scene.emotion && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <EmotionBadge emotion={scene.emotion} intensity={scene.intensity ?? 0} />
          {scene.audio && (
            <span className="text-xs text-gray-600 truncate max-w-xs">
              ♪ {scene.audio.name}
            </span>
          )}
        </div>
      )}
      <p className="text-gray-300 leading-relaxed text-[15px]">{scene.text}</p>
    </div>
  );
}

export default memo(SceneBlock);
