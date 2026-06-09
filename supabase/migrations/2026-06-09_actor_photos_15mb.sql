-- 2026-06-09: 배우 프로필 사진 업로드 한도 5MB → 15MB (대표 요청)
-- 코드(OnboardingForm·GalleryEditForm 클라이언트 체크, /api/upload 서버캡, UI 문구)는 함께 변경됨.
-- ⚠️ 이 SQL을 Supabase SQL Editor에서 1회 실행해야 라이브 버킷에 적용됨.
--    (안 하면 버킷 자체 제한이 5MB라 코드만 바꿔도 >5MB 업로드가 막힘)

UPDATE storage.buckets
SET file_size_limit = 15728640  -- 15MB (15 * 1024 * 1024)
WHERE id = 'actor-photos';

-- 확인용:
-- SELECT id, file_size_limit FROM storage.buckets WHERE id = 'actor-photos';
