-- 배우 출생연도 컬럼 추가 (REPLAY 참고 — 나이 자동계산용)
-- 멱등(IF NOT EXISTS) · 기존 데이터 영향 없음 · 안전하게 여러 번 실행 가능
-- 온보딩(/api/profile/intake)이 출생연도를 저장하고 age_group(나이대)을 자동 도출.
-- 컬럼 없으면 코드가 graceful skip (OPTIONAL_COLS).

ALTER TABLE actors ADD COLUMN IF NOT EXISTS birth_year INTEGER;

COMMENT ON COLUMN actors.birth_year IS '출생연도(4자리) — 나이 자동계산 소스';
