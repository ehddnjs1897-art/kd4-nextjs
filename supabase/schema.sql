-- ============================================
-- KD4 액팅 스튜디오 Supabase 스키마
-- Supabase SQL Editor에서 전체 실행
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES (auth.users 확장)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'actor', 'crew_pending', 'crew', 'editor', 'director', 'admin')),
  actor_id UUID,  -- actors 테이블 참조 (순환 참조 방지위해 FK 나중에 추가)
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 신규 가입 시 profile 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. ACTORS (배우 DB)
-- ============================================
CREATE TABLE IF NOT EXISTS actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  gender TEXT CHECK (gender IN ('남', '여')),
  age_group TEXT CHECK (age_group IN ('20대', '30대', '40대', '50대 이상')),
  height INT,
  weight INT,
  skills TEXT[],                  -- 특기 배열 (예: ARRAY['댄스', '무술'])

  phone TEXT,
  email TEXT,
  instagram TEXT,
  profile_photo TEXT,           -- 메인 9:16 사진 URL
  drive_photo_id TEXT,          -- 드라이브 초기 임포트용 파일 ID
  drive_photo_position TEXT DEFAULT 'center top',
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'drive_import')),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- actors FK to profiles
ALTER TABLE profiles ADD CONSTRAINT profiles_actor_id_fk
  FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE SET NULL;

-- actors RLS
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;

-- 공개 배우 조회 (비로그인 포함)
CREATE POLICY "actors_public_read" ON actors
  FOR SELECT USING (is_public = TRUE);

-- 관리자 전체 접근
CREATE POLICY "actors_admin_all" ON actors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 본인(editor) 수정
CREATE POLICY "actors_editor_update" ON actors
  FOR UPDATE USING (
    id IN (
      SELECT actor_id FROM profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER actors_updated_at
  BEFORE UPDATE ON actors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. ACTOR_PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS actor_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  drive_file_id TEXT,
  drive_photo_id TEXT,           -- 드라이브 파일 ID (썸네일 URL 생성용)
  caption TEXT,
  sort_order INT DEFAULT 0,
  is_profile BOOLEAN DEFAULT FALSE
);

ALTER TABLE actor_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actor_photos_public_read" ON actor_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM actors WHERE id = actor_id AND is_public = TRUE)
  );

CREATE POLICY "actor_photos_editor_write" ON actor_photos
  FOR ALL USING (
    actor_id IN (
      SELECT actor_id FROM profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 4. ACTOR_VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS actor_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  title TEXT,
  youtube_id TEXT,
  sort_order INT DEFAULT 0
);

ALTER TABLE actor_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actor_videos_public_read" ON actor_videos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM actors WHERE id = actor_id AND is_public = TRUE)
  );

CREATE POLICY "actor_videos_editor_write" ON actor_videos
  FOR ALL USING (
    actor_id IN (
      SELECT actor_id FROM profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 5. ACTOR_FILMOGRAPHY
-- ============================================
CREATE TABLE IF NOT EXISTS actor_filmography (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('drama', 'film', 'cf', 'musical', 'theater', 'etc')),
  year INT,
  title TEXT,
  role TEXT,
  production TEXT,               -- 제작사 / 방송사
  sort_order INT DEFAULT 0
);

ALTER TABLE actor_filmography ENABLE ROW LEVEL SECURITY;

CREATE POLICY "filmography_public_read" ON actor_filmography
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM actors WHERE id = actor_id AND is_public = TRUE)
  );

CREATE POLICY "filmography_editor_write" ON actor_filmography
  FOR ALL USING (
    actor_id IN (
      SELECT actor_id FROM profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 6. POSTS (게시판)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT '일반' CHECK (category IN ('일반', '공지', '질문', '자유', '수업')),
  author_id UUID REFERENCES profiles(id),
  author_name TEXT,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_public_read" ON posts FOR SELECT USING (TRUE);
CREATE POLICY "posts_auth_write" ON posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "posts_own_update" ON posts
  FOR UPDATE USING (author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "posts_own_delete" ON posts
  FOR DELETE USING (author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_auth_write" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comments_own_delete" ON comments
  FOR DELETE USING (author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 8. APPLICATIONS (수강신청)
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  class_name TEXT,
  experience TEXT,
  motivation TEXT,
  status TEXT DEFAULT '대기' CHECK (status IN ('대기', '확인', '완료', '취소')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 수강신청은 누구나 INSERT, 관리자만 SELECT
CREATE POLICY "applications_insert_all" ON applications
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "applications_admin_read" ON applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "applications_admin_update" ON applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 9. Supabase Storage 버킷 생성
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('actor-photos', 'actor-photos', TRUE, 5242880,  -- 5MB
   ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('actor-videos', 'actor-videos', TRUE, 104857600, -- 100MB
   ARRAY['video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "actor_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'actor-photos');

CREATE POLICY "actor_photos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'actor-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "actor_photos_own_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'actor-photos'
    AND auth.uid() IS NOT NULL
  );

-- ============================================
-- 10. GAME_SCORES (OFF THE PLASTIC 게임)
-- ============================================
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0),
  duration_ms INT NOT NULL CHECK (duration_ms > 0),
  stage INT DEFAULT 1,
  items_collected INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX idx_game_scores_weekly ON game_scores(created_at, score DESC);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_scores_public_read" ON game_scores
  FOR SELECT USING (TRUE);

CREATE POLICY "game_scores_auth_insert" ON game_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 11. GAME_PRIZES (게임 상품)
-- ============================================
CREATE TABLE IF NOT EXISTS game_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_type TEXT CHECK (period_type IN ('weekly', 'monthly')),
  rank INT NOT NULL,
  prize_type TEXT NOT NULL,
  prize_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_prizes_public_read" ON game_prizes
  FOR SELECT USING (TRUE);

CREATE POLICY "game_prizes_admin_write" ON game_prizes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 12. 조회수 atomic increment 함수
-- ============================================
CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = post_id;
END;
$$;

-- ============================================
-- 13. INSIGHTS (인사이트 수집 — 개인 툴)
-- ============================================
CREATE TABLE IF NOT EXISTS insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT NOT NULL,
  title       TEXT,
  description TEXT,       -- AI 3줄 요약
  image_url   TEXT,
  memo        TEXT,       -- 사용자가 입력한 짧은 메모
  category    TEXT,       -- AI 자동 분류
  tags        TEXT[],     -- AI 자동 태그
  source_type TEXT DEFAULT 'other' CHECK (source_type IN ('video', 'blog', 'article', 'image', 'other')),
  is_favorite BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 개인 툴이므로 RLS 없이 public 접근 (서비스 롤 키로 제어)
ALTER TABLE insights DISABLE ROW LEVEL SECURITY;
