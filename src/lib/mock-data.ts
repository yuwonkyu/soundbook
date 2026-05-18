import type { Book, Scene, AudioMapping } from "./database.types";

export const MOCK_BOOK: Book = {
  id: "mock-book-1",
  gutenberg_id: 1342,
  title: "Pride and Prejudice",
  author: "Jane Austen",
  language: "en",
  raw_text: "",
  created_at: "2026-01-01T00:00:00Z",
};

const passages = [
  "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.",
  "My dear Mr. Bennet, said his lady to him one day, have you heard that Netherfield Park is let at last? Mr. Bennet replied that he had not. But it is, returned she; for Mrs. Long has just been here, and she told me all about it.",
  "The first ball at Netherfield was a splendid affair. The rooms were full, the music excellent, and the dancing kept up with spirit. Mr. Bingley had come down to see his new estate, and he brought with him a party of six; his two sisters, the husband of the eldest, and two other young men.",
  "Mr. Darcy soon drew the attention of the room by his fine, tall person, handsome features, noble mien; and the report which was in general circulation within five minutes after his entrance, of his having ten thousand a year.",
  "Elizabeth Bennet had been obliged, by the scarcity of gentlemen, to sit down for two dances; and during part of that time, Mr. Darcy had been standing near enough for her to overhear a conversation between him and Mr. Bingley.",
  "The evening altogether passed off pleasantly to the whole family. Mrs. Bennet had seen her eldest daughter much admired by the Netherfield party. Mr. Bingley had danced with her twice, and she had been distinguished by his sisters.",
  "A long dispute followed upon this declaration; but Mr. Bennet was firm. It was not in his nature to be obstinate. He had never yet heard of the Bingleys coming to Netherfield. He had never thought of it. But he was firm.",
  "The Bennets were engaged to dine with the Lucases and again during the chief of the day was Miss Lucas so kind as to listen to Mr. Collins. Elizabeth took an opportunity of thanking her.",
  "In the afternoon, the two elder Miss Bennets were able to be for half an hour by themselves; and Elizabeth instantly availed herself of the opportunity of making many enquiries. When Jane had gone to bed, Elizabeth felt this to be impossible.",
  "It was a rainy afternoon. Elizabeth found herself drawn to the window, watching the dark clouds gather over the hills. The sound of distant thunder seemed to echo the turmoil within her heart as she contemplated Mr. Darcy's strange behaviour.",
];

const emotions: Array<{ emotion: string; intensity: number; tags: string[] }> = [
  { emotion: "calm",       intensity: 0.6, tags: ["morning", "countryside"] },
  { emotion: "joy",        intensity: 0.7, tags: ["social", "home"] },
  { emotion: "joy",        intensity: 0.8, tags: ["ball", "dance", "night"] },
  { emotion: "tension",    intensity: 0.65, tags: ["crowd", "wealth"] },
  { emotion: "tension",    intensity: 0.72, tags: ["conversation", "pride"] },
  { emotion: "calm",       intensity: 0.55, tags: ["evening", "family"] },
  { emotion: "mystery",    intensity: 0.5, tags: ["debate", "family"] },
  { emotion: "romance",    intensity: 0.6, tags: ["dinner", "social"] },
  { emotion: "melancholy", intensity: 0.5, tags: ["night", "reflection"] },
  { emotion: "tension",    intensity: 0.75, tags: ["rain", "storm", "longing"] },
];

export const MOCK_SCENES: Scene[] = passages.map((text, i) => ({
  id: `mock-scene-${i}`,
  book_id: MOCK_BOOK.id,
  chapter: Math.floor(i / 5),
  order: i % 5,
  text,
  emotion: emotions[i].emotion,
  intensity: emotions[i].intensity,
  tags: emotions[i].tags,
  analyzed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
}));

export const MOCK_AUDIO_MAPPINGS: AudioMapping[] = [
  {
    id: "mock-audio-0",
    scene_id: "mock-scene-0",
    freesound_id: 416529,
    name: "Peaceful Morning Birds",
    preview_url: "https://cdn.freesound.org/previews/416/416529_5121236-lq.mp3",
    duration: 60,
    license: "https://creativecommons.org/licenses/by/4.0/",
    query: "calm morning countryside",
    is_manual: false,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "mock-audio-9",
    scene_id: "mock-scene-9",
    freesound_id: 243627,
    name: "Rainy Day Atmosphere",
    preview_url: "https://cdn.freesound.org/previews/243/243627_4486188-lq.mp3",
    duration: 90,
    license: "https://creativecommons.org/licenses/by/4.0/",
    query: "tension rain storm longing",
    is_manual: false,
    created_at: "2026-01-01T00:00:00Z",
  },
];

// In-memory store for mock mappings (mutations during the session)
const runtimeMappings = new Map<string, AudioMapping>(
  MOCK_AUDIO_MAPPINGS.map((m) => [m.scene_id, m])
);

export const mockStore = {
  getBook: (id: string) => (id === MOCK_BOOK.id ? MOCK_BOOK : null),

  getScenesWithAudio: (bookId: string) => {
    if (bookId !== MOCK_BOOK.id) return [];
    return MOCK_SCENES.map((s) => ({
      ...s,
      audio: runtimeMappings.get(s.id) ?? null,
    }));
  },

  upsertMapping: (mapping: Omit<AudioMapping, "id" | "created_at">) => {
    const full: AudioMapping = {
      ...mapping,
      id: `mock-audio-${mapping.scene_id}`,
      created_at: new Date().toISOString(),
    };
    runtimeMappings.set(mapping.scene_id, full);
    return full;
  },

  deleteMapping: (sceneId: string) => {
    runtimeMappings.delete(sceneId);
  },
};
