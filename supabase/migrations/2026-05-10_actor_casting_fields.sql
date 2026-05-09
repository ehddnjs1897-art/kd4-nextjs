-- 배우 DB 캐스팅 매칭 강화 — 자동 분류 태그 + 메타 필드
-- 실행: Supabase Dashboard → SQL Editor → Run
-- 멱등: ADD COLUMN IF NOT EXISTS (재실행 안전)

-- 1. casting_tags — Gemini 자동 분류 결과 (회사원/형사/엄마 등)
ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS casting_tags TEXT[];

-- 2. casting_summary — 자동 생성 한 줄 캐스팅 타입 요약 (Gemini)
--    예: "생활감 있는 30대 회사원·형사·아빠 역할에 적합"
ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS casting_summary TEXT;

-- 3. profile_pdf_url — 프로필 PDF 다운로드 링크 (선택, 추후 업로드)
ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS profile_pdf_url TEXT;

-- 4. is_casting_available — 현재 캐스팅 가능 여부 (default true)
ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS is_casting_available BOOLEAN DEFAULT TRUE;

-- 5. last_classified_at — 마지막 자동 분류 실행 시점 (재분류 cron 기준)
ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS last_classified_at TIMESTAMPTZ;

-- 6. 성능 — casting_tags GIN 인덱스 (필터링 빠르게)
CREATE INDEX IF NOT EXISTS idx_actors_casting_tags
  ON actors USING GIN (casting_tags);

-- 7. is_casting_available + is_public 복합 (공개 + 캐스팅 가능 배우 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_actors_public_available
  ON actors (is_public, is_casting_available)
  WHERE is_public = TRUE AND is_casting_available = TRUE;

-- 검증
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'actors' AND column_name IN
--   ('casting_tags', 'casting_summary', 'profile_pdf_url', 'is_casting_available', 'last_classified_at');
