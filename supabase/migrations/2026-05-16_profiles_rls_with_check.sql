-- ============================================
-- 2026-05-16: profiles RLS 정책 강화 (보안 C-1)
-- ============================================
-- 문제: 기존 profiles_own 정책은 FOR ALL USING (auth.uid() = id)만 검증.
--   클라이언트가 supabase.from('profiles').update({ role: 'admin' })로
--   자가 admin 승급 가능. role/actor_id/matched_at 모두 자유 변경.
--
-- 해결: SELECT/UPDATE 정책을 분리하고 UPDATE에 WITH CHECK 추가하여
--   본인의 role/actor_id/matched_at 변경을 차단. 이 값은 서버 측
--   (service_role 또는 SECURITY DEFINER 함수)에서만 변경 가능하게 격리.
--
-- 영향: 본인이 자기 name·phone은 변경 가능. role 변경은 admin 또는 서버만.
-- ============================================

BEGIN;

-- 기존 통합 정책 제거
DROP POLICY IF EXISTS "profiles_own" ON profiles;

-- SELECT: 본인 행 조회 가능 (변경 없음, 분리만 됨)
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: 본인 행만 생성. 트리거 SECURITY DEFINER로 자동 생성되므로
--   클라이언트 INSERT는 사실상 사용되지 않으나 정책은 명시.
CREATE POLICY "profiles_own_insert" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: 본인 행만 업데이트하되, role/actor_id/matched_at 변경 차단.
--   변경하려면 service_role 또는 SECURITY DEFINER 함수 사용 필수.
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())
    AND actor_id IS NOT DISTINCT FROM (SELECT actor_id FROM profiles WHERE id = auth.uid())
    AND matched_at IS NOT DISTINCT FROM (SELECT matched_at FROM profiles WHERE id = auth.uid())
  );

-- DELETE: 본인 행 삭제 가능 (회원 탈퇴 기능 위해 유지, 단 cascade 영향 주의)
CREATE POLICY "profiles_own_delete" ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- admin all 정책은 그대로 유지 (이미 있음).
-- profiles_admin_all 의 재귀 위험은 별도 마이그레이션에서 해결 예정.

COMMIT;
