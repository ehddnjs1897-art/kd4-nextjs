-- 2026-07-09: 오디션 알림 관심분야 (대표 지시 — 멤버가 원하는 공고 유형을 직접 설정)
-- NULL 또는 빈 배열 = 전체 유형 수신 (기존 멤버 발송폭 유지).
-- 값 화이트리스트는 lib/casting-preferences.ts CASTING_TYPE_OPTIONS와 동일:
--   상업·장편영화 / 단편·독립영화 / 드라마·웹드라마 / 연극·뮤지컬 / 광고·기타
-- 코드는 컬럼 미존재 시 42703/PGRST204 폴백으로 무중단 — 이 SQL 실행 전에도 사이트는 정상.

ALTER TABLE actors ADD COLUMN IF NOT EXISTS preferred_casting_types TEXT[];
