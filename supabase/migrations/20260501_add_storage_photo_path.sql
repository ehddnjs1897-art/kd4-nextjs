-- 1회성 마이그레이션: actors 테이블에 storage_photo_path 컬럼 추가
--
-- 목적: Google Drive 썸네일 → Supabase Storage 이전.
--       마이그레이션 스크립트(scripts/migrate-actor-photos.ts)에서
--       Storage 업로드 후 이 컬럼에 경로를 기록.
--
-- 실행:
--   Supabase Dashboard → SQL Editor → 이 파일 전체 복사 → Run
--
-- 멱등성: IF NOT EXISTS 보장. 여러 번 실행해도 안전.

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS storage_photo_path TEXT;

COMMENT ON COLUMN actors.storage_photo_path IS
  'Supabase Storage(actor-photos 버킷) 안의 파일 경로. NULL이면 drive_photo_id로 폴백.';

-- 인덱스는 불필요 (대부분 actor_id로 조회, storage_photo_path는 SELECT용).
