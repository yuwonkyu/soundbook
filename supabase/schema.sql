-- ============================================================
-- SoundBook — Supabase Schema
-- Supabase SQL Editor 또는 supabase db push 로 실행하세요
-- ============================================================

-- 1. books
create table if not exists books (
  id            uuid primary key default gen_random_uuid(),
  gutenberg_id  integer unique not null,
  title         text not null,
  author        text not null,
  language      text not null default 'en',
  raw_text      text not null,
  created_at    timestamptz not null default now()
);

-- 2. scenes
create table if not exists scenes (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references books(id) on delete cascade,
  chapter      integer not null default 0,
  "order"      integer not null,
  text         text not null,
  emotion      text,
  intensity    real,          -- 0.0 ~ 1.0
  tags         text[],
  analyzed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists scenes_book_id_idx on scenes(book_id);

-- 3. audio_mappings
create table if not exists audio_mappings (
  id            uuid primary key default gen_random_uuid(),
  scene_id      uuid unique not null references scenes(id) on delete cascade,
  freesound_id  integer not null,
  name          text not null,
  preview_url   text not null,
  duration      real not null,
  license       text not null,
  query         text not null,
  is_manual     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (기본: 인증 없이 읽기 허용, 쓰기는 서버만)
-- ============================================================

alter table books         enable row level security;
alter table scenes        enable row level security;
alter table audio_mappings enable row level security;

-- 모두 읽기 허용 (public read)
create policy "public read books"
  on books for select using (true);

create policy "public read scenes"
  on scenes for select using (true);

create policy "public read audio_mappings"
  on audio_mappings for select using (true);

-- 쓰기는 service_role(서버) 만 — anon key 로는 불가
-- (Supabase 기본 동작: service_role bypasses RLS)
