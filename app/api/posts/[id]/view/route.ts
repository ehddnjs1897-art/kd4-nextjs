/**
 * POST /api/posts/[id]/view
 * 클라이언트에서 호출 — sessionStorage 기반 중복 방지 후 조회수 증가
 * (서버 컴포넌트 직접 호출 제거로 봇/크롤러 스팸 방지)
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // 로그인 여부 확인 (익명 조회도 허용 — 단 클라이언트 sessionStorage로 1차 중복 방지됨)
    const supabase = await createClient()
    await supabase.auth.getUser()  // 세션 갱신 목적; 실패해도 조회수 증가는 진행

    await supabase.rpc('increment_views', { post_id: id })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
