import SceneListItem from "./SceneListItem";
import type { SceneWithAudio } from "@/components/Reader/SceneBlock";

interface Props {
  scenes: SceneWithAudio[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function SceneList({ scenes, selectedId, onSelect }: Props) {
  // Group by chapter
  const chapters = new Map<number, SceneWithAudio[]>();
  for (const s of scenes) {
    if (!chapters.has(s.chapter)) chapters.set(s.chapter, []);
    chapters.get(s.chapter)!.push(s);
  }
  const chapterEntries = [...chapters.entries()].sort(([a], [b]) => a - b);

  const mappedCount = scenes.filter((s) => s.audio).length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <p className="text-xs text-gray-500">
          {scenes.length}개 장면 · 매핑 {mappedCount}/{scenes.length}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {chapterEntries.map(([chIdx, chScenes]) => (
          <div key={chIdx}>
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">
              Chapter {chIdx + 1}
            </p>
            <div className="space-y-1.5">
              {chScenes.map((scene) => (
                <SceneListItem
                  key={scene.id}
                  scene={scene}
                  isSelected={scene.id === selectedId}
                  onClick={() => onSelect(scene.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
