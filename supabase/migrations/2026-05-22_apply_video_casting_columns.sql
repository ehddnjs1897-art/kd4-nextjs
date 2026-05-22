-- ============================================
-- 2026-05-22 누락된 컬럼 일괄 적용 (영상 R2 + 캐스팅 자동분류)
-- ============================================
-- 진단 결과 2026-05-10 마이그레이션 2개가 운영 DB에 미적용 상태였음.
-- 이 SQL은 그 둘을 합본 + 멱등(IF NOT EXISTS) → 재실행 안전.
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run.

-- ── A. actor_videos: R2 영상 컬럼 ──────────────────────────────
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS r2_key TEXT;            -- R2 객체 경로
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT; -- 파일 크기
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS duration_seconds INT;   -- 길이(선택)
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;-- 업로드 시점
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE actor_videos ALTER COLUMN youtube_id DROP NOT NULL;           -- R2 영상은 youtube_id 없음
CREATE INDEX IF NOT EXISTS idx_actor_videos_actor_id ON actor_videos (actor_id);

-- ── B. actors: 캐스팅 자동분류 컬럼 ───────────────────────────
ALTER TABLE actors ADD COLUMN IF NOT EXISTS casting_tags TEXT[];          -- 직업군 자동 태그
ALTER TABLE actors ADD COLUMN IF NOT EXISTS casting_summary TEXT;         -- 한 줄 캐스팅 요약
ALTER TABLE actors ADD COLUMN IF NOT EXISTS profile_pdf_url TEXT;         -- 프로필 PDF 링크
ALTER TABLE actors ADD COLUMN IF NOT EXISTS is_casting_available BOOLEAN DEFAULT TRUE;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS last_classified_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_actors_casting_tags ON actors USING GIN (casting_tags);

-- ── 검증 ──────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='actor_videos' AND column_name IN ('r2_key','is_public');
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='actors' AND column_name IN ('casting_tags','profile_pdf_url');
