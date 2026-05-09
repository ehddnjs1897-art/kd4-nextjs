-- 배우 출연영상 R2 저장 — Cloudflare R2 통합
-- YouTube/Drive 의존 → R2 private 버킷 + signed URL
-- 멱등: ADD COLUMN IF NOT EXISTS

-- 1. r2_key — Cloudflare R2 객체 경로 (예: "actors/{uuid}/{timestamp}.mp4")
ALTER TABLE actor_videos
  ADD COLUMN IF NOT EXISTS r2_key TEXT;

-- 2. file_size_bytes — 영상 파일 크기 (관리·통계용)
ALTER TABLE actor_videos
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

-- 3. duration_seconds — 영상 길이 (선택, 추후 추출)
ALTER TABLE actor_videos
  ADD COLUMN IF NOT EXISTS duration_seconds INT;

-- 4. uploaded_at — R2 업로드 시점
ALTER TABLE actor_videos
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

-- 5. is_public — 영상 공개 여부 (기본 false = 인증 필요)
ALTER TABLE actor_videos
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- 6. youtube_id를 nullable로 (R2 이전 후 단계적 비활성)
ALTER TABLE actor_videos
  ALTER COLUMN youtube_id DROP NOT NULL;

-- 인덱스 — actor_id 조회 빠르게
CREATE INDEX IF NOT EXISTS idx_actor_videos_actor_id
  ON actor_videos (actor_id);

-- 검증
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'actor_videos' AND column_name IN
--   ('r2_key', 'file_size_bytes', 'duration_seconds', 'uploaded_at', 'is_public');
