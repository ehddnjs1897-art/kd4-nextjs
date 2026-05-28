-- ============================================
-- 2026-05-29  actors.advanced_skills 컬럼 추가
-- ============================================
-- 목적: 스킬 숙련도 ⭐ 표시 (고급/전문가급 스킬 별도 분리)
--   - actors.skills: 모든 특기 (기존 그대로)
--   - actors.advanced_skills: 고급 숙련도 (⭐ 표시할 항목, skills의 부분집합)
--
-- 표시 규칙:
--   skill in advanced_skills → ⭐ 표시 (네이티브/전문가급)
--   그 외 → 일반 pill
--
-- 멱등: IF NOT EXISTS — 재실행 안전
-- 실행: Supabase Dashboard → SQL Editor → Run
-- ============================================

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS advanced_skills TEXT[];

COMMENT ON COLUMN actors.advanced_skills IS
  '⭐ 고급/전문가급 스킬 목록 (skills의 부분집합). 회원가입·마이페이지 편집 시 본인이 체크.';

-- 검증
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='actors' AND column_name='advanced_skills';
