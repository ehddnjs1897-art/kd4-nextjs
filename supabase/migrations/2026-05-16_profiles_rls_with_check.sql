-- ============================================
-- 2026-05-16: profiles 민감 컬럼 잠금 (보안 C-1)
-- ============================================
-- 문제: profiles_own 정책이 FOR ALL USING (auth.uid() = id)만 검증.
--   클라이언트가 supabase.from('profiles').update({ role: 'admin' })로
--   자가 admin 승급 가능. role/actor_id/matched_at 모두 자유 변경.
--
-- 1차 시도(RLS WITH CHECK + self-subquery)는 폐기:
--   profiles_admin_all 정책이 이미 profiles를 self-select 하므로
--   WITH CHECK 안에서 profiles를 다시 읽으면 무한 재귀
--   (ERROR: infinite recursion detected in policy for relation "profiles").
--
-- 해결: RLS는 그대로 두고 BEFORE UPDATE 트리거로 민감 컬럼을 잠근다.
--   SECURITY DEFINER 함수 안에서는 RLS를 우회하므로 재귀가 없다.
--   - service_role 키(서버) 및 직접 DB연결(마이그레이션/대시보드) → 전체 허용
--   - admin → 전체 허용
--   - 그 외 일반 로그인 유저 → role/actor_id/matched_at 을 이전 값으로 강제 고정
--     (name/phone 은 자유롭게 수정 가능)
--
-- 멱등(idempotent): 여러 번 실행해도 안전.
-- 적용: Supabase Dashboard SQL Editor에 전체 붙여넣고 1회 실행.
-- ============================================

CREATE OR REPLACE FUNCTION public.lock_privileged_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims text := current_setting('request.jwt.claims', true);
BEGIN
  -- 1) 직접 DB연결(SQL 에디터·마이그레이션) 또는 서버 service_role 키 → 전체 허용
  IF claims IS NULL OR (claims::json ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 2) 관리자(admin) → 전체 허용 (SECURITY DEFINER라 RLS 우회 → 재귀 없음)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN NEW;
  END IF;

  -- 3) 그 외 일반 유저 → 민감 컬럼을 이전 값으로 강제 고정 (자가 승급 차단)
  NEW.role       := OLD.role;
  NEW.actor_id   := OLD.actor_id;
  NEW.matched_at := OLD.matched_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_privileged_profile_columns();
