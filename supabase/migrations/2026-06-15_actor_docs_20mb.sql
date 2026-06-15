-- ============================================
-- 2026-06-15 actor-docs 버킷 용량 10MB → 20MB (🔴 배우 프로필 등록 실패 수정)
-- ============================================
-- 증상(2026-06-15, 박이아 배우 신고): 프로필 양식을 다 채워 제출했는데 DB 등록 안 됨.
--   진단: profiles엔 있으나(role=actor) actors row 0건 + Storage 업로드 0개 + 서버 에러 로그 0건.
--
-- 원인: 코드/UI/signed-upload는 프로필 문서(PPT/PDF)를 20MB까지 허용하는데
--   (OnboardingForm.tsx:105 20MB · signed-upload/route.ts:24 20MB),
--   실제 actor-docs 버킷 file_size_limit이 10MB에 멈춰 있었음(코드는 10→15→20MB로 올렸으나
--   버킷 설정 미반영 = "스키마 drift"). 10~20MB PPT는:
--     ① 클라 검증 통과(20MB↓) → ② signed-upload 통과(서버 로그 없음) →
--     ③ 클라→Storage 직접 업로드(uploadToSignedUrl)에서 버킷이 10MB 초과로 거부(클라 단계라 서버 로그 0건) →
--     ④ throw → intake 미호출 → actor row 미생성.
--   배우 프로필 PPT는 사진이 많아 보통 10MB를 넘으므로 PPT 큰 배우 다수가 등록 실패.
--
-- 해결: 버킷 제한을 코드 의도(20MB)와 일치시킴. (actor-photos 15MB는 코드와 이미 일치 — 그대로)
--
-- 멱등: 여러 번 실행해도 안전.

UPDATE storage.buckets SET file_size_limit = 20971520 WHERE id = 'actor-docs';  -- 20 * 1024 * 1024

-- 확인용:
-- SELECT id, file_size_limit FROM storage.buckets WHERE id IN ('actor-docs','actor-photos','actor-videos');
