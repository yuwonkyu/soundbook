import { type SceneEmotion } from "./analyze";
import { searchSounds, type FreesoundResult } from "./freesound";

export type AudioMapping = {
  scene: string;
  emotion: string;
  intensity: number;
  tags: string[];
  audio: FreesoundResult | null;
  query: string;
};

// Map emotion + tags to a Freesound search query
function buildQuery(emotion: SceneEmotion): string {
  const emotionKeywords: Record<string, string> = {
    tension:    "suspense tense ambient",
    joy:        "happy uplifting bright",
    melancholy: "sad melancholic piano",
    fear:       "horror dark scary",
    calm:       "peaceful ambient nature",
    mystery:    "mysterious eerie atmosphere",
    romance:    "romantic soft gentle",
  };

  const base = emotionKeywords[emotion.emotion] ?? emotion.emotion;
  const tagStr = emotion.tags.slice(0, 2).join(" ");
  return `${base} ${tagStr}`.trim();
}

export async function mapAudioToScenes(
  scenes: SceneEmotion[]
): Promise<AudioMapping[]> {
  const results = await Promise.all(
    scenes.map(async (scene) => {
      const query = buildQuery(scene);
      const sounds = await searchSounds(query, { pageSize: 3 });
      return {
        ...scene,
        audio: sounds[0] ?? null,
        query,
      };
    })
  );
  return results;
}
