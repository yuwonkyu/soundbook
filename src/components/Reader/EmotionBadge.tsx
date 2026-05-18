const STYLES: Record<string, { label: string; cls: string }> = {
  tension:    { label: "긴장",   cls: "bg-red-900/50 text-red-300 border-red-800" },
  joy:        { label: "기쁨",   cls: "bg-yellow-900/50 text-yellow-300 border-yellow-800" },
  melancholy: { label: "우울",   cls: "bg-blue-900/50 text-blue-300 border-blue-800" },
  fear:       { label: "공포",   cls: "bg-purple-900/50 text-purple-300 border-purple-800" },
  calm:       { label: "평온",   cls: "bg-green-900/50 text-green-300 border-green-800" },
  mystery:    { label: "신비",   cls: "bg-indigo-900/50 text-indigo-300 border-indigo-800" },
  romance:    { label: "로맨스", cls: "bg-pink-900/50 text-pink-300 border-pink-800" },
};

interface Props {
  emotion: string;
  intensity: number;
}

export default function EmotionBadge({ emotion, intensity }: Props) {
  const style = STYLES[emotion] ?? {
    label: emotion,
    cls: "bg-gray-800 text-gray-400 border-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${style.cls}`}
    >
      {style.label}
      <span className="opacity-60">{Math.round(intensity * 100)}%</span>
    </span>
  );
}
