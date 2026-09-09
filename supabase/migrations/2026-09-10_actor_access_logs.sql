-- ============================================
-- 2026-09-10 ACTOR_ACCESS_LOGS (배우 DB 다운로드·연락처 조회 감사 로그)
-- ============================================
-- 목적: "누가 / 언제 / 어떤 배우의 / 무엇을" 가져갔는지 서버 재시작과 무관하게 영구 기록.
--       기존엔 각 라우트의 메모리 Map(분당 횟수 제한)뿐이라 재시작 시 소실되고
--       "누가 무엇을" 정보가 아예 없었다. 디렉터 권한 승인자가 배우 전원 연락처를
--       조회하고 문서를 전부 내려받아도 확인할 방법이 없던 구멍을 메운다.
--
-- 기록 지점 (권한 검사 통과 직후, 3곳):
--   · profile_doc — GET /api/actors/[id]/profile        (프로필 문서 PPTX/PDF 다운로드)
--   · video       — GET /api/videos/[id]/signed-url?download=1 (영상 다운로드 URL 발급)
--   · contact     — GET /api/actors/[id]                 (연락처 phone/email 포함 응답)
--
-- 설계 메모:
--   ① FK 없음 — 감사 로그는 원본(배우·유저)이 지워져도 남아야 한다.
--      actors ON DELETE CASCADE를 걸면 배우 삭제 시 그 배우의 열람 이력이 통째로 사라진다.
--      또 INSERT가 FK 위반으로 실패하면 안 되므로(로깅 실패 = 서비스 영향 0 원칙) 참조 제약을 두지 않는다.
--   ② 쓰기는 service_role(서버 라우트)만 — RLS를 우회하므로 INSERT 정책 불필요.
--   ③ 읽기는 admin만 — 감사 로그는 일반 사용자·디렉터가 절대 못 읽어야 한다(자기 열람 이력 포함).
--
-- 멱등(idempotent): 여러 번 실행해도 안전 (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- 적용: Supabase Dashboard → SQL Editor에 전체 붙여넣고 1회 실행 (스키마 변경은 대표 손으로).
-- ============================================

CREATE TABLE IF NOT EXISTS public.actor_access_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 누가 (auth.users.id = profiles.id). FK 미설정 — 위 설계메모 ① 참고
  user_id     UUID NOT NULL,

  -- 어떤 배우 (actors.id). FK 미설정 — 배우 삭제 후에도 이력 보존
  actor_id    UUID NOT NULL,

  -- 무슨 행위
  action      TEXT NOT NULL
              CHECK (action IN (
                'profile_doc',  -- 프로필 문서(PPTX/PDF) 다운로드
                'video',        -- 출연영상/독백 다운로드 URL 발급
                'contact'       -- 연락처(phone/email) 포함 응답 수신
              )),

  -- 어디서 (x-real-ip 우선, 없으면 x-forwarded-for 첫 홉 — 위조 가능하므로 참고용)
  ip          TEXT,

  -- 무엇으로 (User-Agent, 512자 절단)
  user_agent  TEXT,

  -- 언제
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 인덱스 ──
-- "이 배우 정보를 누가 가져갔나" (배우별 최신순)
CREATE INDEX IF NOT EXISTS idx_actor_access_logs_actor
  ON public.actor_access_logs (actor_id, created_at DESC);

-- "이 사용자가 무엇을 가져갔나" (사용자별 최신순 — 대량 수집 탐지)
CREATE INDEX IF NOT EXISTS idx_actor_access_logs_user
  ON public.actor_access_logs (user_id, created_at DESC);

-- "최근 N일 전체 이력" / 보존기간 정리용
CREATE INDEX IF NOT EXISTS idx_actor_access_logs_created
  ON public.actor_access_logs (created_at DESC);

-- "다운로드만" / "연락처 조회만" 유형별 집계
CREATE INDEX IF NOT EXISTS idx_actor_access_logs_action
  ON public.actor_access_logs (action, created_at DESC);

-- ── RLS ──
-- 필요함: 감사 로그는 일반 사용자·디렉터가 읽으면 안 된다(누가 자기를 열람했는지 역추적 방지 포함).
-- RLS를 켜고 admin 정책만 두면 anon/authenticated 키로는 SELECT·INSERT 모두 차단되고,
-- 서버 라우트의 service_role 키만 RLS를 우회해 기록할 수 있다.
ALTER TABLE public.actor_access_logs ENABLE ROW LEVEL SECURITY;

-- 정책 재실행 안전화: 있으면 지우고 다시 생성 (CREATE POLICY는 IF NOT EXISTS 미지원)
DROP POLICY IF EXISTS "actor_access_logs_admin_read" ON public.actor_access_logs;
CREATE POLICY "actor_access_logs_admin_read" ON public.actor_access_logs
  FOR SELECT USING (public.is_admin());

-- INSERT/UPDATE/DELETE 정책은 일부러 두지 않는다.
--   · INSERT: 서버 라우트의 service_role만 (RLS 우회) — 클라이언트 위조 기록 차단
--   · UPDATE/DELETE: 아무도 못 함 — 감사 로그 변조 방지 (보존기간 정리는 아래 주석 참고)

COMMENT ON TABLE public.actor_access_logs IS
  '배우 DB 감사 로그 — 프로필 문서/영상 다운로드, 연락처 조회 이력. 쓰기=service_role, 읽기=admin.';

-- ── (선택) 보존기간 정리 — 필요해지면 대표가 직접 실행 ──
-- 무료 플랜 DB 500MB 한도 대비. 행당 약 200바이트라 연 10만 건이어도 20MB 수준이므로 당장은 불필요.
-- DELETE FROM public.actor_access_logs WHERE created_at < NOW() - INTERVAL '2 years';
