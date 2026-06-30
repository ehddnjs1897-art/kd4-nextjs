-- 연령대(age_group) 버킷 세분화 + 생년 기반 자동분류 백필
-- 배경: 대표 지시로 배우 DB 필터에 40·50·60대+ 버튼 노출. 기존 CHECK 제약이
--       '20대','30대','40대','50대 이상' 4종만 허용 → 신규 '50대'/'60대 이상' 저장 시 23514로 거부.
--       또한 프로필 문서/파일명에서 11명의 생년(birth_year)을 추출해 저장해 둔 상태.
-- 이 마이그레이션 1회 실행이: ① 제약을 넓히고 ② 생년 있는 배우를 나이대로 자동 재분류한다. (멱등 — 여러 번 안전)
--
-- 적용: Supabase 대시보드 → SQL Editor → 아래 전체 붙여넣기 → Run.

-- 1) CHECK 제약 확장 (레거시 '50대 이상'은 호환용으로 함께 허용)
ALTER TABLE actors DROP CONSTRAINT IF EXISTS actors_age_group_check;
ALTER TABLE actors
  ADD CONSTRAINT actors_age_group_check
  CHECK (age_group IN ('20대', '30대', '40대', '50대', '60대 이상', '50대 이상'));

-- 2) 생년 있는 배우 → 나이대 자동 분류 (프로필 문서에서 추출·저장된 birth_year 기준)
--    생년 없는 배우는 손대지 않음(기존 age_group 유지). 기준연도 2026.
UPDATE actors SET age_group = CASE
    WHEN 2026 - birth_year BETWEEN 20 AND 29 THEN '20대'
    WHEN 2026 - birth_year BETWEEN 30 AND 39 THEN '30대'
    WHEN 2026 - birth_year BETWEEN 40 AND 49 THEN '40대'
    WHEN 2026 - birth_year BETWEEN 50 AND 59 THEN '50대'
    WHEN 2026 - birth_year >= 60          THEN '60대 이상'
    ELSE age_group END
  WHERE birth_year IS NOT NULL;

COMMENT ON COLUMN actors.age_group IS '연령대 버킷: 20대/30대/40대/50대/60대 이상 (+ 레거시 50대 이상). 생년 있으면 자동분류';
