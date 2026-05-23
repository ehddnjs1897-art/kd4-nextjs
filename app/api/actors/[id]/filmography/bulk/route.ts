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
    bulkPostMap.set(user.id, [...times, now])

    // ── 본문 파싱 ────────────────────────────────────────
    let parsed: { items: FilmItem[] }
    try {
      const clBulk = parseInt(request.headers.get('content-length') ?? '0', 10)
      if (clBulk > 65_536) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
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

    const VALID_FILM_CATEGORIES = new Set(['drama', 'movie', 'musical', 'theater', 'commercial', 'etc'])

    for (const item of items) {
      if (!String(item.title ?? '').trim()) continue
      // 연도 범위 검증
      const rawYear = item.year !== undefined && item.year !== null ? Number(item.year) : undefined
      if (rawYear !== undefined && (!Number.isInteger(rawYear) || rawYear < 1900 || rawYear > new Date().getFullYear() + 2)) continue
      const clean: FilmItem = {
        category: (item.category && VALID_FILM_CATEGORIES.has(item.category)) ? item.category : 'drama',
        year: rawYear,
        title: String(item.title).trim().slice(0, 200),
        role: item.role?.trim().slice(0, 100) || undefined,
        broadcaster: item.broadcaster?.trim().slice(0, 100) || undefined,
        film_type: item.film_type?.trim().slice(0, 50) || undefined,
      }
      if (item.id) {
        // UUID 형식 아닌 id는 UPDATE 대신 INSERT로 처리 (오염된 id 방어)
        if (!UUID_RE.test(item.id)) { toInsert.push(clean); continue }
        toUpdate.push({ ...clean, id: item.id })
      } else {
        toInsert.push(clean)
      }
    }

    // ── 병렬 처리 ─────────────────────────────────────────
    const updatePromises = toUpdate.map(item =>
      supabaseAdmin
        .from('actor_filmography')
        .update({
          category: item.category,
          year: item.year ?? null,
          title: item.title,
          role: item.role ?? null,
          broadcaster: item.broadcaster ?? null,
          film_type: item.film_type ?? null,
        })
        .eq('id', item.id)
        .eq('actor_id', actorId)
        .then(({ error }) => {
          if (error) console.error('[filmography/bulk] UPDATE 오류:', error.message)
          return { id: item.id, ok: !error }
        })
    )

    // sort_order: 기존 최대 sort_order 이후로 이어서 삽입
    const { data: maxRow } = await supabaseAdmin
      .from('actor_filmography')
      .select('sort_order')
      .eq('actor_id', actorId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const baseSortOrder = (maxRow?.sort_order ?? -1) + 1

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

    const [updateResults, insertResult] = await Promise.all([
      Promise.all(updatePromises),
      insertRows.length > 0
        ? supabaseAdmin.from('actor_filmography').insert(insertRows).select('id')
        : Promise.resolve({ data: [], error: null }),
    ])

    const insertedIds = (insertResult.data ?? []).map((r: { id: string }) => r.id)
    const results = [
      ...updateResults.map(r => ({ id: r.id, ok: r.ok })),
      ...insertedIds.map((id: string) => ({ id, ok: true })),
    ]

    const errors = results.filter(r => !r.ok).length + (insertResult.error ? 1 : 0)
    if (insertResult.error) console.error('[filmography/bulk] INSERT 오류:', insertResult.error.message)

    revalidateTag('actors')
    revalidateTag(`actor-${actorId}`)
    return NextResponse.json({ results, errors })
  } catch (err) {
    console.error('[POST /api/actors/[id]/filmography/bulk]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
