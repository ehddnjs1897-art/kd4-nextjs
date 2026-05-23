/**
 * PATCH  /api/actors/[id]/filmography/[filmId] — 항목 수정
 * DELETE /api/actors/[id]/filmography/[filmId] — 항목 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidateTag } from '@/lib/revalidate'

type Ctx = { params: Promise<{ id: string; filmId: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 레이트 리밋: 1분 내 60회 PATCH/DELETE 초과 시 차단 (급속 반복 쓰기 방지)
const filmPatchMap = new Map<string, number[]>()
const FILM_PATCH_WINDOW_MS = 60_000
const FILM_PATCH_MAX = 60

async function authorize(actorId: string, userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('actor_id, role').eq('id', userId).maybeSingle()
  return profile && (profile.actor_id === actorId || profile.role === 'admin' || profile.role === 'editor')
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { id, filmId } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(filmId))
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    // 레이트 리밋: 1분 내 60회 초과 시 차단
    const now = Date.now()
    const times = (filmPatchMap.get(user.id) ?? []).filter(t => now - t < FILM_PATCH_WINDOW_MS)
    if (times.length >= FILM_PATCH_MAX) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    const clFilmPatch = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
    if (clFilmPatch > 16_384) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })

    filmPatchMap.set(user.id, [...times, now])
    if (filmPatchMap.size > 2000) {
      for (const [k, v] of filmPatchMap) { if (v.every(t => now - t > FILM_PATCH_WINDOW_MS)) filmPatchMap.delete(k) }
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch { return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 }) }
    const allowed = ['category', 'year', 'title', 'role', 'broadcaster', 'film_type']
    const patch: Record<string, unknown> = {}
    for (const k of allowed) { if (k in body) patch[k] = body[k] }

    // 필드 길이 제한
    if (typeof patch.title === 'string' && patch.title.length > 200)
      return NextResponse.json({ error: '제목은 200자 이하입니다.' }, { status: 400 })
    if (typeof patch.role === 'string' && patch.role.length > 100)
      return NextResponse.json({ error: '역할은 100자 이하입니다.' }, { status: 400 })
    if (typeof patch.broadcaster === 'string' && patch.broadcaster.length > 100)
      return NextResponse.json({ error: '방송사·배급사는 100자 이하입니다.' }, { status: 400 })
    if (typeof patch.film_type === 'string' && patch.film_type.length > 50)
      return NextResponse.json({ error: '영화 유형은 50자 이하입니다.' }, { status: 400 })

    // 카테고리 allowlist
    const VALID_FILM_CATEGORIES = new Set(['drama', 'film', 'cf', 'musical', 'theater', 'etc'])
    if (patch.category !== undefined && !VALID_FILM_CATEGORIES.has(patch.category as string)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리입니다.' }, { status: 400 })
    }
    // 연도 범위 검증
    if (patch.year !== undefined && patch.year !== null) {
      const y = Number(patch.year)
      if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 2) {
        return NextResponse.json({ error: `연도는 1900~${new Date().getFullYear() + 2} 범위여야 합니다.` }, { status: 400 })
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('actor_filmography').update(patch).eq('id', filmId).eq('actor_id', id).select('id').maybeSingle()
    if (error) {
      console.error('[filmography PATCH] DB 오류:', error.message)
      return NextResponse.json({ error: '필모그래피 수정에 실패했습니다.' }, { status: 500 })
    }
    if (!updated) return NextResponse.json({ error: '필모그래피 항목을 찾을 수 없습니다.' }, { status: 404 })
    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/actors/[id]/filmography/[filmId]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { id, filmId } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(filmId))
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    // 레이트 리밋: PATCH와 동일 Map 공유 — 1분 내 60회 초과 시 차단
    const nowD = Date.now()
    const timesD = (filmPatchMap.get(user.id) ?? []).filter(t => nowD - t < FILM_PATCH_WINDOW_MS)
    if (timesD.length >= FILM_PATCH_MAX) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    filmPatchMap.set(user.id, [...timesD, nowD])
    if (filmPatchMap.size > 2000) {
      const cutoffD = nowD - FILM_PATCH_WINDOW_MS
      for (const [k, v] of filmPatchMap) { if (v.every(t => t < cutoffD)) filmPatchMap.delete(k) }
    }

    const { data: deleted, error } = await supabaseAdmin
      .from('actor_filmography').delete().eq('id', filmId).eq('actor_id', id).select('id').maybeSingle()
    if (error) {
      console.error('[filmography DELETE] DB 오류:', error.message)
      return NextResponse.json({ error: '필모그래피 삭제에 실패했습니다.' }, { status: 500 })
    }
    if (!deleted) return NextResponse.json({ error: '필모그래피 항목을 찾을 수 없습니다.' }, { status: 404 })
    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/actors/[id]/filmography/[filmId]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
