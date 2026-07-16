/**
 * GET /u/{token} — 수신거부 단축 링크 (2026-07-10 대표 지시 "수신거부링크 좀 짧게")
 *
 * 8자 토큰 = actor.id UUID의 첫 8자리(첫 하이픈 앞 그룹) — 오디션 알림용, 기존 그대로.
 * 6자 토큰 = 상담자 현황(잠재고객) 마케팅 문자용 — lib/lead-unsubscribe-tokens.ts 고정 매핑.
 *   (이 배치의 상담 카드들은 Notion 페이지 ID가 거의 동일한 접두사를 가져서 prefix
 *    조회가 안 통하기 때문에, actors처럼 실제 ID의 일부를 쓰지 않고 완전히 별도로
 *    발급한 랜덤 토큰을 고정 매핑 테이블에서 조회한다.)
 *
 * 문자에 넣던 90자짜리 /api/.../unsubscribe?id={uuid} 를
 * https://kd4.club/u/3fafa3ce 처럼 줄이기 위한 리다이렉트 전용 라우트.
 *
 * 동작: 토큰으로 대상이 유일하게 특정되면 기존 확인 페이지로 302.
 * 실제 수신거부는 그 페이지의 확정 버튼(POST)으로만 — 여기선 DB/API 쓰기 없음.
 * 보안: actor 토큰은 공개 프로필 URL과 동일 값이라 노출이 추가 위험을 만들지 않고,
 * lead 토큰은 애초에 실제 ID와 무관한 랜덤값이라 더 안전함
 * (양쪽 다 POST 확인 단계가 오탐·제3자 해지를 막는다).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { LEAD_UNSUBSCRIBE_TOKENS } from '@/lib/lead-unsubscribe-tokens'

const ACTOR_TOKEN_RE = /^[0-9a-f]{8}$/i
const LEAD_TOKEN_RE = /^[0-9a-f]{6}$/i

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = (token ?? '').trim().toLowerCase()

  // 6자 토큰 — 잠재고객(상담자 현황) 수신거부, DB 조회 없이 고정 매핑에서 즉시 확정
  if (LEAD_TOKEN_RE.test(t)) {
    const notionPageId = LEAD_UNSUBSCRIBE_TOKENS[t]
    if (!notionPageId) {
      return new NextResponse('링크를 찾을 수 없습니다. 문자에 있던 링크를 다시 확인해주세요.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/api/leads/unsubscribe'
    url.search = `?id=${notionPageId}`
    return NextResponse.redirect(url, 302)
  }

  if (!ACTOR_TOKEN_RE.test(t)) {
    return new NextResponse('잘못된 링크입니다.', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  try {
    // UUID는 바이트 순 정렬이므로 앞 8자 프리픽스는 [t-0000…, t-ffff…] 범위 조회로 특정 가능 (인덱스 사용)
    const { data, error } = await getSupabaseAdmin()
      .from('actors')
      .select('id')
      .gte('id', `${t}-0000-0000-0000-000000000000`)
      .lte('id', `${t}-ffff-ffff-ffff-ffffffffffff`)
      .limit(2)

    if (error) {
      console.error('[u/token] 조회 실패:', error.message)
      return new NextResponse('일시적인 오류입니다. 잠시 후 다시 시도해주세요.', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
    // 0건(없음) 또는 2건+(프리픽스 충돌 — 확률상 사실상 없음)이면 특정 불가
    if (!data || data.length !== 1) {
      return new NextResponse('링크를 찾을 수 없습니다. 문자에 있던 링크를 다시 확인해주세요.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    const url = req.nextUrl.clone()
    url.pathname = '/api/casting-alerts/unsubscribe'
    url.search = `?id=${data[0].id}`
    return NextResponse.redirect(url, 302)
  } catch (err) {
    console.error('[u/token] 예외:', err instanceof Error ? err.message : '(unknown)')
    return new NextResponse('일시적인 오류입니다.', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}
