-- ============================================
-- 2026-07-01  대표출연작(featured) 지정 기능
-- ============================================
-- 목적: actor_filmography.is_featured BOOLEAN
--   배우 본인/관리자가 필모그래피(드라마·영화·CF 등) 중 원하는 작품을
--   "대표출연작"으로 지정 → 프로필 상단 하이라이트로 노출.
--   기존 "최근 출연" 자동 요약 섹션을 대체(수동 큐레이션).
--
-- 멱등: IF NOT EXISTS — 재실행 안전
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- 주의: 컬럼 적용 전에도 사이트 정상 동작(42703 fallback — 읽기/쓰기 모두 graceful).
--       적용하면 대표작 지정·저장·상단 표시가 활성화됨.
-- ============================================

ALTER TABLE actor_filmography ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN actor_filmography.is_featured IS
  '대표출연작 여부. 배우 본인/관리자가 마이페이지에서 지정 → 프로필 상단 하이라이트 노출.';

-- 대표작 조회 가속 — actor_id별 featured만 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_filmography_featured
  ON actor_filmography (actor_id) WHERE is_featured = TRUE;

-- 검증
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='actor_filmography' AND column_name='is_featured';
