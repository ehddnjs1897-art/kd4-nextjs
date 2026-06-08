-- ============================================
-- 2026-06-08  배우 DB 고도화: 연기 가능 연령대 + 사투리
-- ============================================
-- 목적:
--   1) actors.playing_age_min / playing_age_max
--      실제 나이 외 "화면상 소화 연령대"(예: 25~32세). 캐스팅 1순위 검색조건.
--   2) actors.dialects TEXT[]
--      사용 가능 사투리 지역 목록 (예: {경상,전라}). 한국 공고에서 자주 찾는 조건.
--      (언어/억양은 기존 skills로 흡수 — 대표님 5/8 결정 "언어억양 빼고 사투리 가능으로")
--
-- 멱등: IF NOT EXISTS — 재실행 안전
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- 주의: 컬럼 적용 전에도 사이트는 정상 동작(42703 fallback). 적용하면 입력·표시·검색 활성화.
-- ============================================

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS playing_age_min SMALLINT,
  ADD COLUMN IF NOT EXISTS playing_age_max SMALLINT,
  ADD COLUMN IF NOT EXISTS dialects TEXT[];

COMMENT ON COLUMN actors.playing_age_min IS
  '연기 가능 연령대 최소값(화면상 소화 가능 나이). 회원가입·마이페이지에서 본인 입력.';
COMMENT ON COLUMN actors.playing_age_max IS
  '연기 가능 연령대 최대값(화면상 소화 가능 나이). 회원가입·마이페이지에서 본인 입력.';
COMMENT ON COLUMN actors.dialects IS
  '사용 가능 사투리 지역 배열(예: {경상,전라,충청}). 회원가입·마이페이지에서 본인 선택.';

-- 검증
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='actors' AND column_name IN ('playing_age_min','playing_age_max','dialects');
