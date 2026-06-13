-- ============================================
-- 2026-06-13 enrollment_type CHECK 제약 동기화 (🔴 긴급 — 수강신청 500 수정)
-- ============================================
-- 증상(2026-06-13 발견, 프로덕션 로그 확인): POST /api/enrollments 가
--   enrollment_type='수업 유지' 등에서 500.
--   Postgres 에러: new row for relation "enrollments" violates check constraint
--                  "enrollments_enrollment_type_check"
--   → enroll 페이지 기본 선택이 '수업 유지'(EnrollForm.tsx:89)이므로,
--     기존 멤버의 "다음 달 이어서 수강"(가장 흔한 신청)이 사실상 전부 실패.
--
-- 원인: 코드와 DB CHECK 불일치.
--   - 코드 SSOT: EnrollForm.tsx TYPES + app/api/enrollments/route.ts VALID_TYPES =
--       ['신규 등록','수업 유지','클래스 추가·변경','퍼스널 브랜딩 서비스']
--   - 2026-05-22 초기 CHECK = ['신규 등록','기존 KD4 멤버','브랜딩 서비스']  ← stale
--
-- 해결: 코드가 SSOT. CHECK를 코드 값으로 확장.
--   레거시 2개 값('기존 KD4 멤버','브랜딩 서비스')도 함께 유지 →
--   2026-05-22 seed 등 기존 row의 제약 위반 방지(데이터 보존).
--
-- 멱등: DROP CONSTRAINT IF EXISTS 후 재생성. 여러 번 실행해도 안전.
-- ⚠️ 만약 "constraint ... does not exist"가 아닌 다른 오류가 나면 제약 이름이 다른 것 —
--    아래로 실제 이름 확인 후 알려주세요:
--    SELECT conname FROM pg_constraint
--    WHERE conrelid = 'enrollments'::regclass AND contype = 'c';

ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_enrollment_type_check;

ALTER TABLE enrollments ADD CONSTRAINT enrollments_enrollment_type_check
  CHECK (enrollment_type IN (
    -- 현행 코드(EnrollForm.tsx / api/enrollments)
    '신규 등록', '수업 유지', '클래스 추가·변경', '퍼스널 브랜딩 서비스',
    -- 레거시(2026-05-22 초기 — 기존 row 데이터 보존용)
    '기존 KD4 멤버', '브랜딩 서비스'
  ));
