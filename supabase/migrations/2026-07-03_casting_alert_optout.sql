-- 오디션 정보 SMS 수신거부 컬럼 추가
-- 배경: 배우DB 나이대·특기 매칭 기반 오디션 공고 자동 SMS 발송 시스템 도입.
--       문자 하단에 수신거부 링크(kd4.club/api/casting-alerts/unsubscribe?id={actor.id})를 넣고,
--       클릭 시 이 컬럼을 true로 세팅해 이후 발송 대상에서 영구 제외한다.
-- 이 마이그레이션은 멱등 — 여러 번 실행해도 안전.
--
-- 적용: Supabase 대시보드 → SQL Editor → 아래 전체 붙여넣기 → Run.

ALTER TABLE actors ADD COLUMN IF NOT EXISTS casting_alert_optout BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN actors.casting_alert_optout IS '오디션 정보 SMS 수신거부 (true=자동발송 대상에서 영구 제외, 수신거부 링크 클릭 시 자동 설정)';
