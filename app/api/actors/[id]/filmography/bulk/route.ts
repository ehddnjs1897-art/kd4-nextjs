/**
 * POST /api/actors/[id]/filmography/bulk
 * 필모그래피 전체를 한 번에 동기화
 *
 * body: {
 *   items: { id?: string; category: string; year?: number; title: string; role?: string; broadcaster?: string; film_type?: string }[]
 * }
 *
 * 처리 전략:
 *  - id 있음 + title 있음 → UPSERT (update)
 *  - id 없음 + title 있음 → INSERT
 *  - title 없음 → 건너뜀
 *  - 기존 id 목록에서 요청에 없는 것 → 그대로 유지 (삭제는 별도 DELETE로)
 *
 * 반환: { results: { id: string; ok: boolean }[] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidateTag } from '@/lib/revalidate'

type Ctx = { params: Promise<{ id: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 레이트 리밋: 5분 내 10회 bulk 요청 초과 시 차단 (각 요청이 최대 200개 → DoS 방어)
const bulkPostMap = new Map<string, number[]>()
const BULK_WINDOW_MS = 5 * 60_000
const BULK_MAX = 10

interface FilmItem {
  id?: string
  category?: string
  year?: number | string
  title: string
  role?: string
  broadcaster?: string
  film_type?: string
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { id: actorId } = await params

    if (!UUID_RE.test(actorId)) {
      return NextResponse.json({ error: '잘못된 배우 ID입니다.' }, { status: 400 })
    }

    // ── 인증 ────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('actor_id, role').eq('id', user.id).maybeSingle()
    const isAllowed = profile && (
      profile.actor_id === actorId ||
      profile.role === 'admin' ||
      profile.role === 'editor'
    )
    if (!isAllowed) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    // 레이트 리밋: 5분 내 10회 초과 시 차단
    const now = Date.now()
    const times = (bulkPostMap.get(user.id) ?? []).filter(t => now - t < BULK_WINDOW_MS)
    if (times.length >= BULK_MAX) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (5분 최대 10회)' }, { status: 429 })
    }
    const clBulk = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
    if (clBulk > 65_536) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })

    bulkPostMap.set(user.id, [...times, now])
    if (bulkPostMap.size > 2000) {
      const cutoff = now - BULK_WINDOW_MS
      for (const [k, v] of bulkPostMap) { if (v.every(t => t < cutoff)) bulkPostMap.delete(k) }
    }

    // ── 본문 파싱 ────────────────────────────────────────
    let parsed: { items: FilmItem[] }
    try {
      parsed = await request.json()
    } catch {
      return NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 })
    }
    const { items } = parsed
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items 배열이 필요합니다.' }, { status: 400 })
    }
    // DoS 방지: 한 번에 최대 200개 — 초과 시 DB 커넥션 풀 고갈 방지
    const MAX_BULK_ITEMS = 200
    if (items.length > MAX_BULK_ITEMS) {
      return NextResponse.json({ error: `한 번에 최대 ${MAX_BULK_ITEMS}개까지 처리할 수 있습니다.` }, { status: 400 })
    }

    // ── 유효 항목 분류 ────────────────────────────────────
    const toUpdate: (FilmItem & { id: string })[] = []
    const toInsert: FilmItem[] = []

    const VALID_FILM_CATEGORIES = new Set(['drama', 'film', 'cf', 'musical', 'theater', 'etc'])

    for (const item of items) {
      if (!String(item.title ?? '').trim()) continue
      // 연도 범위 검증
      const rawYear = item.year !== undefined && item.year !== null ? Number(item.year) : undefined
      if (rawYear !== undefined && (!Number.isInteger(rawYear) || rawYear < 1900 || rawYear > new Date().getFullYear() + 2)) continue
      const clean: FilmItem = {
        category: (item.category && VALID_FILM_CATEGORIES.has(item.category)) ? item.category : 'drama',
        year: rawYear,
        title: String(item.title).trim().slice(0, 200),
        role: String(item.role ?? '').trim().slice(0, 100) || undefined,
        broadcaster: String(item.broadcaster ?? '').trim().slice(0, 100) || undefined,
        film_type: String(item.film_type ?? '').trim().slice(0, 50) || undefined,
      }
      if (item.id) {
        // UUID 형식 아닌 id는 UPDATE 대신 INSERT로 처리 (오염된 id 방어)
        if (!UUID_RE.test(item.id)) { toInsert.push(clean); continue }
        toUpdate.push({ ...clean, id: item.id })
      } else {
        toInsert.push(clean)
      }
    }

    // ── UPDATE 전 소유권 검증: 제출된 id가 실제 actorId 소유인지 확인 (IDOR 방어) ──
    const rejectedIds: string[] = [] // 비소유 ID — ok:false로 caller에게 명시적 반환
    if (toUpdate.length > 0) {
      const submittedIds = toUpdate.map(item => item.id)
      const { data: owned } = await supabaseAdmin
        .from('actor_filmography')
        .select('id')
        .eq('actor_id', actorId)
        .in('id', submittedIds)
      const ownedSet = new Set((owned ?? []).map((r: { id: string }) => r.id))
      // 소유 확인된 항목만 upsert; 비소유 id는 rejectedIds에 추적해 ok:false 반환 (silent-drop 제거)
      for (let i = toUpdate.length - 1; i >= 0; i--) {
        if (!ownedSet.has(toUpdate[i].id)) {
          rejectedIds.push(toUpdate[i].id)
          toUpdate.splice(i, 1)
        }
      }
    }

    // ── UPDATE: 단일 upsert로 N개 병렬 쿼리 대신 DB 커넥션 압박 해소 ───────────
    const upsertRows = toUpdate.map(item => ({
      id: item.id,
      actor_id: actorId, // 소유권 사전 검증 완료
      category: item.category,
      year: item.year ?? null,
      title: item.title,
      role: item.role ?? null,
      broadcaster: item.broadcaster ?? null,
      film_type: item.film_type ?? null,
    }))
    const { data: upserted, error: upsertErr } = toUpdate.length > 0
      ? await supabaseAdmin.from('actor_filmography').upsert(upsertRows, { onConflict: 'id' }).select('id')
      : { data: [] as { id: string }[], error: null }
    if (upsertErr) console.error('[filmography/bulk] UPSERT 오류:', upsertErr.message)
    // 반환된 ID Set으로 silent no-op(경쟁 삭제) 탐지
    const upsertedIds = new Set((upserted ?? []).map(r => r.id))
    // upsertErr 발생 시 insertResult도 진행하지만 최종 응답에 207/500으로 반영됨
    const updateResults = toUpdate.map(item => ({ id: item.id, ok: !upsertErr && upsertedIds.has(item.id) }))

    // INSERT 필요한 경우 COUNT + MAX(sort_order)를 병렬 조회 (순차 2 round-trip → 1)
    let baseSortOrder = 0
    if (toInsert.length > 0) {
      const [{ count: existingCount }, { data: maxRow }] = await Promise.all([
        supabaseAdmin
          .from('actor_filmography')
          .select('id', { count: 'exact', head: true })
          .eq('actor_id', actorId),
        supabaseAdmin
          .from('actor_filmography')
          .select('sort_order')
          .eq('actor_id', actorId)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      const MAX_FILMOGRAPHY = 500
      if ((existingCount ?? 0) + toInsert.length > MAX_FILMOGRAPHY) {
        return NextResponse.json(
          { error: `필모그래피는 최대 ${MAX_FILMOGRAPHY}개까지 등록할 수 있습니다.` },
          { status: 400 }
        )
      }
      baseSortOrder = (maxRow?.sort_order ?? -1) + 1
    }

    // 배치 INSERT — N개 개별 쿼리 대신 단일 쿼리로 처리
    const insertRows = toInsert.map((item, idx) => ({
      actor_id: actorId,
      category: item.category,
      year: item.year ?? null,
      title: item.title,
      role: item.role ?? null,
      broadcaster: item.broadcaster ?? null,
      film_type: item.film_type ?? null,
      sort_order: baseSortOrder + idx,
    }))

    const insertResult = insertRows.length > 0
      ? await supabaseAdmin.from('actor_filmography').insert(insertRows).select('id')
      : { data: [], error: null }

    const insertedIds = (insertResult.data ?? []).map((r: { id: string }) => r.id)
    const results = [
      ...updateResults.map(r => ({ id: r.id, ok: r.ok })),
      ...rejectedIds.map(id => ({ id, ok: false, reason: 'not_owned' })),
      ...insertedIds.map((id: string) => ({ id, ok: true })),
    ]

    const errors = results.filter(r => !r.ok).length + (insertResult.error ? 1 : 0)
    if (insertResult.error) console.error('[filmography/bulk] INSERT 오류:', insertResult.error.message)

    revalidateTag('actors')
    revalidateTag(`actor-${actorId}`)
    return NextResponse.json({ results, errors }, { status: errors > 0 ? 207 : 200 })
  } catch (err) {
    console.error('[POST /api/actors/[id]/filmography/bulk]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
