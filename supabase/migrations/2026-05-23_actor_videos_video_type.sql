-- ============================================
-- 2026-05-23  actor_videos.video_type 누락 컬럼 보정
-- ============================================
-- 진단: 운영 DB에 actor_videos.video_type 컬럼이 없어(42703)
--       배우 상세 페이지(/actors/[id]) 조회가 전건 실패 → 전체 404 발생.
-- intake / videos API / 대시보드 / ActorTabs 모두 video_type 을 read/write 하므로
-- 컬럼이 정상 존재해야 함 ('reel' = 출연영상, 'monologue' = 독백).
-- 멱등(IF NOT EXISTS) → 재실행 안전. Supabase Dashboard → SQL Editor 에서 실행.

ALTER TABLE actor_videos
  ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'reel';

-- 검증
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='actor_videos' AND column_name='video_type';
