-- ============================================
-- 2026-05-06 백필 — Google Sheets 신청자 → consultations
-- ============================================
-- 배경:
-- /api/notify가 5/4 이후 consultations 테이블에 INSERT 시도했지만
-- 라이브 Supabase에 테이블이 존재하지 않아 모두 catch로 흘러감.
-- 다행히 Make 시나리오 4743018 → Google Sheets(1ojqHIK...JZyeWE)에
-- row가 정상 누적됨. 그 시트를 1차 출처로 consultations에 백필.
--
-- 실행 순서:
-- 1. 먼저 2026-05-04_consultations.sql 실행해서 테이블 생성
-- 2. 이 백필 실행
--
-- 테스트성 row(전화번호 1085640244, test@kd4.club, [테스트], 권동원(테스트) 등)는
-- 비즈니스 데이터가 아니라서 제외. 진짜 신청자만 INSERT.
-- ============================================

-- 진짜 신청자 1: 김신 (4/15 — 광고 시작 전이지만 외부 신청 추정)
-- 단, 전화번호가 운영자 본인과 동일(1085640244)이라 사용자 검토 권장 — 일단 보류

-- 진짜 신청자 2: 김현준 (4/21, 인스타그램 광고 유입)
INSERT INTO consultations (name, phone, email, class_name, source, motivation, status, created_at)
VALUES (
  '김현준',
  '01025202197',
  'okay913@naver.com',
  '출연영상 클래스',
  '인스타그램',
  '유입경로: 인스타그램 / 마이즈너경험: 처음이다.',
  '대기',
  '2026-04-21 12:55:38+09'::timestamptz
)
ON CONFLICT DO NOTHING;

-- 진짜 신청자 3: 키키키 (5/4, 네이버 블로그)
-- 검토 필요: 이메일 date1231@naver.com이 4/15 권동원 row와 동일 — 지인/본인 테스트 가능성
-- 운영자 판단으로 진짜 신청자면 유지, 아니면 DELETE
INSERT INTO consultations (name, phone, email, class_name, source, motivation, status, created_at)
VALUES (
  '키키키',
  '01012340222',
  'date1231@naver.com',
  '마이즈너 테크닉 정규 클래스',
  '네이버 블로그',
  '유입경로: 네이버 블로그 / 희망클래스: 마이즈너 테크닉 정규 클래스 / 마이즈너경험: 처음이다.',
  '대기',
  '2026-05-04 15:20:28+09'::timestamptz
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 검증 쿼리
-- ============================================
-- SELECT name, phone, email, class_name, source, status, created_at
--   FROM consultations
--   ORDER BY created_at DESC;
