/**
 * PATCH /api/profile
 * 로그인한 사용자의 이름·전화번호 수정
 *
 * 이름/전화번호 변경 후 actor_id 없는 사용자 → 자동 재매칭 시도
 * (KD4 멤버가 가입 시 잘못된 전화번호를 입력했다가 수정한 경우를 커버)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { matchActorOnSignup } from '@/lib/actor-matching'

// PATCH 레이트 리밋: 30초 냉각 (자동 재매칭 DB 스캔 방어)
const profilePatchMap = new Map<string, number>()
const PROFILE_PATCH_COOLDOWN_MS = 30_000

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 레이트 리밋: 30초 냉각
    const nowPP = Date.now()
    const lastPP = profilePatchMap.get(user.id) ?? 0
    if (nowPP - lastPP < PROFILE_PATCH_COOLDOWN_MS) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    profilePatchMap.set(user.id, nowPP)
    if (profilePatchMap.size > 1000) {
      const cutoffPP = nowPP - PROFILE_PATCH_COOLDOWN_MS
      for (const [k, v] of profilePatchMap) {
        if (v < cutoffPP) profilePatchMap.delete(k)
      }
    }

    let body: { name?: string; phone?: string }
    try {
      const clProfile = parseInt(request.headers.get('content-length') ?? '0', 10)
      if (clProfile > 16_384) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
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
    if (/[\x00-\x1f\x7f]/.test(name.trim())) {
      return NextResponse.json({ error: '이름에 허용되지 않는 문자가 포함되어 있습니다.' }, { status: 400 })
    }
    if (/[<>]/.test(name.trim())) {
      return NextResponse.json({ error: '이름에 허용되지 않는 문자(<>)가 포함되어 있습니다.' }, { status: 400 })
    }
    if (phone !== undefined && phone.trim() !== '') {
      const phoneClean = phone.trim()
      // 최소 7자리 이상 숫자가 포함된 전화번호 형식 요구 (공백·하이픈·+ 허용, 개행 금지)
      if (phoneClean.length > 20 || !/^[+]?[\d \-().]{7,20}$/.test(phoneClean) || (phoneClean.match(/\d/g)?.length ?? 0) < 5) {
        return NextResponse.json({ error: '전화번호 형식이 올바르지 않습니다.' }, { status: 400 })
      }
    }

    const updates: Record<string, string | null> = { name: name.trim() }
    if (phone !== undefined) updates.phone = phone.trim() || null

    // supabaseAdmin으로 RLS 우회
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.error('[PATCH /api/profile] error:', error instanceof Error ? error.message : String(error))
      return NextResponse.json({ error: '정보 수정 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // ── 자동 재매칭: actor_id 없는 사용자가 이름/전화번호 변경 시 ──────────────
    let matched = false
    let actorId: string | undefined
    if (phone && name) {
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('actor_id, role').eq('id', user.id).maybeSingle()
      const needsMatch = !profile?.actor_id && (profile?.role === 'actor' || profile?.role === 'member')
      if (needsMatch) {
        try {
          const result = await matchActorOnSignup(user.id, name.trim(), phone.trim())
          matched = result.matched
          actorId = result.actorId
        } catch (e) {
          console.error('[PATCH /api/profile] 재매칭 오류:', e instanceof Error ? e.message : String(e))
        }
      }
    }

    return NextResponse.json({ success: true, matched })
  } catch (err) {
    console.error('[PATCH /api/profile] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '정보 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
