/**
 * 배우 DB 감사 로그 — 프로필 문서/영상 다운로드, 연락처 조회 기록.
 *
 * 테이블: public.actor_access_logs (supabase/migrations/2026-09-10_actor_access_logs.sql)
 *
 * 설계 원칙 (절대 준수):
 *   ① 권한 로직에 절대 개입하지 않는다 — 이 함수는 "이미 통과한" 요청을 기록만 한다.
 *   ② 로깅 실패가 사용자 요청을 막지 않는다 — 모든 예외를 삼키고 console.error로만 남긴다.
 *      (마이그레이션 미적용 상태여도 다운로드는 정상 동작하고, 서버 로그에 실패만 찍힌다.)
 *   ③ 응답을 블로킹하지 않는다 — next/server의 after()로 응답 전송 후에 INSERT를 수행한다.
 *      after()는 같은 함수 실행(invocation) 안에서 돌아가므로 Vercel 함수 호출 수는 늘지 않는다.
 *
 * 서버 전용 (service_role 사용) — 클라이언트에서 import 금지.
 */
import 'server-only'
import { after } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

/** 기록 대상 행위 — DB CHECK 제약과 값이 일치해야 한다 */
export type ActorAccessAction =
  | 'profile_doc' // 프로필 문서(PPTX/PDF) 다운로드
  | 'video' // 출연영상/독백 다운로드 URL 발급
  | 'contact' // 연락처(phone/email) 포함 응답 수신

const MAX_IP_LEN = 64
const MAX_UA_LEN = 512

/**
 * 클라이언트 IP 추정.
 * x-real-ip 우선 (Vercel이 붙이는 값 — 클라이언트 위조 불가).
 * 없으면 x-forwarded-for 첫 홉 폴백 — 위조 가능하지만 감사 참고용이라 그대로 저장한다.
 * (레이트 리밋 같은 "게이트"에는 절대 이 폴백을 쓰지 말 것)
 */
function clientIp(headers: Headers): string | null {
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, MAX_IP_LEN)
  const fwd = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return fwd ? fwd.slice(0, MAX_IP_LEN) : null
}

/**
 * 감사 로그 1행 기록 (fire-and-forget).
 *
 * 호출 위치는 반드시 "권한 검사를 통과한 직후". 반환값 없음 — await 하지 말 것.
 */
export function logActorAccess(params: {
  request: Request
  userId: string
  actorId: string
  action: ActorAccessAction
}): void {
  let row: Record<string, string | null>
  try {
    row = {
      user_id: params.userId,
      actor_id: params.actorId,
      action: params.action,
      ip: clientIp(params.request.headers),
      user_agent: params.request.headers.get('user-agent')?.slice(0, MAX_UA_LEN) ?? null,
    }
  } catch (e) {
    // 헤더 접근 실패 등 — 기록만 포기하고 요청은 그대로 진행
    console.error('[actor-access-log] 행 구성 실패:', e instanceof Error ? e.message : String(e))
    return
  }

  const write = async () => {
    try {
      const { error } = await getSupabaseAdmin().from('actor_access_logs').insert(row)
      if (error) {
        console.error(`[actor-access-log] INSERT 실패 (${row.action}):`, error.message)
      }
    } catch (e) {
      console.error(
        `[actor-access-log] INSERT 예외 (${row.action}):`,
        e instanceof Error ? e.message : String(e)
      )
    }
  }

  try {
    // 응답이 나간 뒤 실행 — 다운로드 지연 0
    after(write)
  } catch {
    // after()를 쓸 수 없는 컨텍스트 폴백 — 그래도 await 하지 않아 응답을 막지 않는다
    void write()
  }
}
