/**
 * POST /api/posts/[id]/view
 * 클라이언트에서 호출 — sessionStorage 기반 중복 방지 후 조회수 증가
 * (서버 컴포넌트 직접 호출 제거로 봇/크롤러 스팸 방지)
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 인스턴스별 조회수 중복 방지 — user+post 조합당 60초 쿨다운
const viewCooldowns = new Map<string, number>()
const VIEW_COOLDOWN_MS = 60_000

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // 로그인한 사용자만 조회수 증가 허용 (봇/스크레이퍼 스팸 방지)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    // 60초 이내 같은 user+post 조합은 조용히 무시
    const cooldownKey = `${user.id}:${id}`
    const lastView = viewCooldowns.get(cooldownKey) ?? 0
    if (Date.now() - lastView < VIEW_COOLDOWN_MS) {
      return NextResponse.json({ ok: true })
    }
    viewCooldowns.set(cooldownKey, Date.now())
    // 만료 항목 정리 — 2000건 초과 시만 정리 (매 write마다 전체 순회 방지)
    if (viewCooldowns.size > 2000) {
      for (const [k, ts] of viewCooldowns) {
        if (Date.now() - ts > VIEW_COOLDOWN_MS) viewCooldowns.delete(k)
      }
    }

    await supabase.rpc('increment_views', { post_id: id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/posts/[id]/view]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
