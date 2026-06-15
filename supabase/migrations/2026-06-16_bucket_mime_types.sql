-- ============================================
-- 2026-06-16 배우 업로드 버킷 allowed_mime_types 완화 (🔴 등록 실패 2차 원인)
-- ============================================
-- 증상(박이아 등): 6/15 버킷 크기 10→20MB로 올렸는데도 "10MB로 줄여도 등록 안 됨".
--   진단: actors 0건 + Storage 0개 + 서버 로그 0건 여전 → 크기 아닌 다른 버킷 제한.
--
-- 원인: 버킷 allowed_mime_types(허용 파일형식)가 너무 좁았음.
--   - actor-photos: image/jpeg·png·webp 만 → 🔴 아이폰 원본 HEIC(image/heic)·HEIF 거부.
--   - actor-docs: pptx·pdf 만 → 브라우저가 PPT를 application/octet-stream으로 보내면 거부.
--   클라→Storage 직접 업로드(uploadToSignedUrl)에서 MIME 불일치로 거부 → 파일 0개 + 서버 로그 0건
--   (크기 거부와 동일한 무증상 실패). 코드/UI는 확장자만 검사하고 MIME은 안 봐서 통과시켜 버림.
--
-- 해결: 버킷이 받을 수 있는 MIME을 실제 사용자 파일에 맞게 완화.
--   사진은 HEIC/HEIF/gif 추가(svg는 XSS 위험이라 제외 — 공개 버킷). 문서는 ppt(구버전)·octet-stream 추가.
--   실제 업로드 테스트(scripts/verify-bucket-upload.ts)로 HEIC·octet-stream·pptx·pdf 모두 통과 확인.
--
-- 멱등: UPDATE라 여러 번 실행 안전. (scripts/fix-bucket-mime-types.ts로 라이브 적용 완료)

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'
]
WHERE id = 'actor-photos';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',  -- .pptx
  'application/vnd.ms-powerpoint',                                              -- .ppt
  'application/pdf',
  'application/octet-stream'                                                    -- 브라우저 MIME 미상 폴백
]
WHERE id = 'actor-docs';

-- 확인용:
-- SELECT id, allowed_mime_types FROM storage.buckets WHERE id IN ('actor-photos','actor-docs');
