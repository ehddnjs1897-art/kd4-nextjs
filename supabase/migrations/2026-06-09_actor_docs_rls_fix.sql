-- ============================================
-- 2026-06-09  actor-docs 버킷 RLS 업로드 정책 복구 (온보딩 PPT 업로드 실패 수정)
-- ============================================
-- 증상: 배우 온보딩 폼 제출 시 "actor-docs 업로드 실패: new row violates row-level
--       security policy" 에러 → 전체 제출 실패 (PPT가 맨 먼저 업로드되므로).
--
-- 원인: actor-docs 버킷은 라이브에 존재(2026-05-22 생성)하나, 2026-05-22 마이그레이션의
--       INSERT/DELETE RLS 정책이 라이브 DB에 적용되지 않음(=정책 없는 버킷 → 모든 업로드 거부).
--       검증: service_role 업로드 200 OK(버킷 정상), anon 업로드 403 "new row violates RLS"(사용자 에러와 동일).
--
-- 설계: actor-photos 버킷과 동일한 보안 모델(로그인 사용자 업로드 허용, 읽기는 signed URL).
--       기존 마이그레이션(2026-05-22)의 정책과 동일 — 구조 변경 아님, 미적용분 복구일 뿐.
-- 멱등: DROP ... IF EXISTS 후 CREATE → 재실행 안전.
-- 실행: Supabase Dashboard → SQL Editor → Run
-- ============================================

-- actor-docs 버킷이 없다면 함께 보장 (PPT/PDF, 비공개, 10MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'actor-docs', 'actor-docs', FALSE, 10485760,  -- 10MB
  ARRAY[
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- .pptx
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 업로드(INSERT): 로그인 사용자만
DROP POLICY IF EXISTS "actor_docs_auth_upload" ON storage.objects;
CREATE POLICY "actor_docs_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'actor-docs' AND auth.uid() IS NOT NULL
  );

-- 삭제(DELETE): 로그인 사용자만
DROP POLICY IF EXISTS "actor_docs_own_delete" ON storage.objects;
CREATE POLICY "actor_docs_own_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'actor-docs' AND auth.uid() IS NOT NULL
  );

-- ============================================
-- 검증 (실행 후 확인용)
-- ============================================
-- SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'actor_docs%';
--   → actor_docs_auth_upload(INSERT), actor_docs_own_delete(DELETE) 2행이 나오면 정상.
