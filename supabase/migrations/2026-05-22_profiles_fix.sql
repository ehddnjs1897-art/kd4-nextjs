-- =============================================================
-- 2026-05-22 profiles 테이블 버그 수정
-- 1. email 컬럼 추가 (callback route에서 upsert 시 필요)
-- 2. RLS 무한재귀 수정 (profiles_admin_all 정책 재작성)
-- =============================================================

-- ── 1. email 컬럼 추가 ───────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ── 2. is_admin() SECURITY DEFINER 함수 생성 ─────────────────
-- RLS 정책이 profiles를 조회할 때 다시 RLS가 적용되는 무한재귀 방지.
-- SECURITY DEFINER = 함수 소유자(postgres) 권한으로 실행 → RLS 우회
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- ── 3. 기존 재귀 유발 정책 삭제 ─────────────────────────────
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- ── 4. 새 정책 적용 (is_admin() 경유 → 재귀 없음) ───────────
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());

-- ── 확인 쿼리 (실행 후 이걸로 테스트) ───────────────────────
-- SELECT id, email, role FROM profiles LIMIT 3;
