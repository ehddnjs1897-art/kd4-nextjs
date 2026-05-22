/**
 * PATCH /api/profile
 * 로그인한 사용자의 이름·전화번호 수정
 *
 * 이름/전화번호 변경 후 actor_id 없는 사용자 → 자동 재매칭 시도
 * (KD4 배우가 가입 시 잘못된 전화번호를 입력했다가 수정한 경우를 커버)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { matchActorOnSignup } from '@/lib/actor-matching'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { name?: string; phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  const { name, phone } = body

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (name.trim().length > 100) {
    return NextResponse.json({ error: '이름은 100자 이하로 입력해주세요.' }, { status: 400 })
  }
  if (phone !== undefined && phone.trim().length > 20) {
    return NextResponse.json({ error: '전화번호 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const updates: Record<string, string> = { name: name.trim() }
  if (phone !== undefined) updates.phone = phone.trim()

  // supabaseAdmin으로 RLS 우회
  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('[PATCH /api/profile] error:', error)
    return NextResponse.json({ error: '정보 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // ── 자동 재매칭: actor_id 없는 사용자가 이름/전화번호 변경 시 ──────────────
  let matched = false
  let actorId: string | undefined
  if (phone && name) {
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('actor_id, role').eq('id', user.id).single()
    const needsMatch = !profile?.actor_id && (profile?.role === 'actor' || profile?.role === 'member')
    if (needsMatch) {
      try {
        const result = await matchActorOnSignup(user.id, name.trim(), phone.trim())
        matched = result.matched
        actorId = result.actorId
      } catch (e) {
        console.error('[PATCH /api/profile] 재매칭 오류:', e)
      }
    }
  }

  return NextResponse.json({ success: true, matched, actorId })
}
