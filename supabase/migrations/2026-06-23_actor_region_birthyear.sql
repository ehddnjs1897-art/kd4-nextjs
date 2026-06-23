-- 배우 거주지·출생연도 컬럼 추가 (REPLAY 참고 — 캐스팅 검색용 구조화 데이터)
-- 멱등(IF NOT EXISTS) · 기존 데이터 영향 없음 · 안전하게 여러 번 실행 가능
-- 온보딩(/api/profile/intake)이 이 컬럼에 거주지·출생연도를 저장하고,
-- 출생연도로 age_group(나이대)을 자동 도출한다. 컬럼 없으면 코드가 graceful skip.

ALTER TABLE actors ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS birth_year INTEGER;

COMMENT ON COLUMN actors.region IS '거주 지역 (서울·경기 등) — 온보딩 드롭다운';
COMMENT ON COLUMN actors.birth_year IS '출생연도(4자리) — 나이 자동계산 소스';
