import EmotionBadge from "@/components/Reader/EmotionBadge";
import type { SceneWithAudio } from "@/components/Reader/SceneBlock";

interface Props {
  scene: SceneWithAudio;
  isSelected: boolean;
  onClick: () => void;
}

export default function SceneListItem({ scene, isSelected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
        isSelected
          ? "border-purple-600 bg-purple-950/40"
          : "border-gray-800 bg-gray-900 hover:border-gray-600"
      }`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {scene.emotion ? (
          <EmotionBadge emotion={scene.emotion} intensity={scene.intensity ?? 0} />
        ) : (
          <span className="text-xs text-gray-600 border border-gray-800 rounded-full px-2 py-0.5">
            미분석
          </span>
        )}
        {scene.audio && (
          <span className="text-xs text-cyan-700 truncate max-w-[160px]">
            ♪ {scene.audio.name}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
        {scene.text}
      </p>
    </button>
  );
}
