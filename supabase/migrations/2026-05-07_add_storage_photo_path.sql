-- ============================================
-- actors 테이블에 storage_photo_path 컬럼 추가
-- Drive 썸네일 → Supabase Storage 마이그레이션 준비
-- ============================================
-- 배경:
-- /actors 페이지가 현재 Drive 썸네일 (https://drive.google.com/thumbnail?id=...&sz=w600)
-- 사용 중. Drive URL은 캐싱·신뢰성 약함 + next/image 캐시 못 씀.
-- Supabase Storage로 옮기면 edge cache + 안정성 ↑.
--
-- 이 마이그레이션은 컬럼만 추가. 실제 사진 이전은 별도 스크립트로:
--   scripts/migrate-actor-photos.ts (1회성)
-- ============================================

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS storage_photo_path TEXT;

COMMENT ON COLUMN actors.storage_photo_path IS
  'Supabase Storage 버킷 actor-photos 내 파일 경로. 우선 사용. drive_photo_id는 폴백.';

-- 인덱스는 추가 안 함 — null/notnull 분리 쿼리 거의 없음

-- ============================================
-- 검증
-- ============================================
-- SELECT id, name, drive_photo_id, storage_photo_path FROM actors LIMIT 5;
