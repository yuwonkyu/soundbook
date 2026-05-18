export type Database = {
  public: {
    Tables: {
      books: {
        Row: Book;
        Insert: Omit<Book, "id" | "created_at">;
        Update: Partial<Omit<Book, "id" | "created_at">>;
      };
      scenes: {
        Row: Scene;
        Insert: Omit<Scene, "id" | "created_at">;
        Update: Partial<Omit<Scene, "id" | "created_at">>;
      };
      audio_mappings: {
        Row: AudioMapping;
        Insert: Omit<AudioMapping, "id" | "created_at">;
        Update: Partial<Omit<AudioMapping, "id" | "created_at">>;
      };
    };
  };
};

export type Book = {
  id: string;
  gutenberg_id: number;
  title: string;
  author: string;
  language: string;
  raw_text: string;
  created_at: string;
};

export type Scene = {
  id: string;
  book_id: string;
  chapter: number;
  order: number;
  text: string;
  emotion: string | null;
  intensity: number | null;
  tags: string[] | null;
  analyzed_at: string | null;
  created_at: string;
};

export type AudioMapping = {
  id: string;
  scene_id: string;
  freesound_id: number;
  name: string;
  preview_url: string;
  duration: number;
  license: string;
  query: string;
  is_manual: boolean;
  created_at: string;
};
