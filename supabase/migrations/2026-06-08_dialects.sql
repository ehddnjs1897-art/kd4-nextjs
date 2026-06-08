-- ============================================
-- 2026-06-08  배우 DB 고도화: 사투리(가능 지역)
-- ============================================
-- 목적: actors.dialects TEXT[]
--   사용 가능 사투리 지역 목록 (예: {경상,전라}). 한국 공고에서 자주 찾는 조건.
--   옵션(고정 6개): 경상 / 전라 / 충청 / 강원 / 제주 / 이북
--   (언어·억양은 기존 skills로 흡수 — 대표님 5/8 결정. 연령대는 06-08 취소)
--
-- 멱등: IF NOT EXISTS — 재실행 안전
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- 주의: 컬럼 적용 전에도 사이트 정상 동작(42703 fallback). 적용하면 입력·저장·표시 활성화.
-- ============================================

ALTER TABLE actors ADD COLUMN IF NOT EXISTS dialects TEXT[];

COMMENT ON COLUMN actors.dialects IS
  '사용 가능 사투리 지역 배열(예: {경상,전라}). 회원가입·마이페이지에서 본인 선택. 옵션: 경상/전라/충청/강원/제주/이북';

-- 검증
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='actors' AND column_name='dialects';
