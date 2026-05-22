-- ============================================
-- 2026-05-22 배우 프로필 자가등록(온보딩) + 디렉터 승인
-- ============================================
-- 목적:
--   1) 디렉터 가입 시 '승인 대기' 상태 (director_pending) — 승인 전 배우DB/연락처 잠금
--   2) 배우 본인 프로필 제출용 컬럼 (비공개 PPT 경로 등)
--   3) PPT 보관용 비공개 스토리지 버킷 (actor-docs)
-- 멱등: 재실행 안전 (IF EXISTS / IF NOT EXISTS / ON CONFLICT)
-- 실행: Supabase Dashboard → SQL Editor → Run
-- ============================================

-- 1. profiles.role 에 'director_pending' 추가 ----------------------------------
--    기존 인라인 CHECK(profiles_role_check)를 교체한다.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'member', 'actor',
    'crew_pending', 'crew',
    'editor',
    'director_pending', 'director',
    'admin'
  ));

-- 2. actors 에 자가등록 관련 컬럼 ---------------------------------------------
ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS profile_doc_path TEXT;      -- 비공개 PPT 경로 (actor-docs 버킷)
ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS self_managed BOOLEAN DEFAULT FALSE; -- 본인 온보딩으로 생성된 row
ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS intake_submitted_at TIMESTAMPTZ;    -- 프로필 제출 시점

COMMENT ON COLUMN actors.profile_doc_path IS
  '비공개 버킷 actor-docs 내 PPT/PDF 경로. 디렉터/관리자만 signed URL로 다운로드.';
COMMENT ON COLUMN actors.self_managed IS
  '배우 본인이 온보딩에서 직접 생성/관리하는 row 여부 (관리자/드라이브 임포트와 구분).';

-- 3. 비공개 스토리지 버킷: actor-docs (PPT/PDF, 10MB) -------------------------
--    PPT는 개인정보(경력·연락처) 포함 가능 → public=FALSE.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'actor-docs', 'actor-docs', FALSE, 10485760,  -- 10MB
  ARRAY[
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- .pptx
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- actor-docs Storage RLS
--   업로드: 로그인 사용자. 읽기: 서버(service_role)만 → public read 정책 없음 (signed URL로 제공).
DROP POLICY IF EXISTS "actor_docs_auth_upload" ON storage.objects;
CREATE POLICY "actor_docs_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'actor-docs' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "actor_docs_own_delete" ON storage.objects;
CREATE POLICY "actor_docs_own_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'actor-docs' AND auth.uid() IS NOT NULL
  );

-- ============================================
-- 검증
-- ============================================
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'profiles'::regclass AND conname = 'profiles_role_check';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='actors' AND column_name IN ('profile_doc_path','self_managed','intake_submitted_at');
-- SELECT id, public, file_size_limit FROM storage.buckets WHERE id='actor-docs';
