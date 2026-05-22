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

type Ctx = { params: Promise<{ id: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

    // ── 유효 항목 분류 ────────────────────────────────────
    const toUpdate: (FilmItem & { id: string })[] = []
    const toInsert: FilmItem[] = []

    const VALID_FILM_CATEGORIES = new Set(['drama', 'movie', 'musical', 'theater', 'commercial', 'etc'])

    for (const item of items) {
      if (!item.title?.trim()) continue
      const clean: FilmItem = {
        category: (item.category && VALID_FILM_CATEGORIES.has(item.category)) ? item.category : 'drama',
        year: item.year ? Number(item.year) : undefined,
        title: item.title.trim().slice(0, 200),
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
        .then(({ error }) => ({ id: item.id, ok: !error, error: error?.message }))
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

    const insertPromises = toInsert.map((item, idx) =>
      supabaseAdmin
        .from('actor_filmography')
        .insert({
          actor_id: actorId,
          category: item.category,
          year: item.year ?? null,
          title: item.title,
          role: item.role ?? null,
          broadcaster: item.broadcaster ?? null,
          film_type: item.film_type ?? null,
          sort_order: baseSortOrder + idx,
        })
        .select('id')
        .single()
        .then(({ data, error }) => ({
          id: data?.id ?? '',
          ok: !error,
          error: error?.message,
          originalIdx: toUpdate.length + idx,
        }))
    )

    const [updateResults, insertResults] = await Promise.all([
      Promise.all(updatePromises),
      Promise.all(insertPromises),
    ])

    const results = [
      ...updateResults.map(r => ({ id: r.id, ok: r.ok })),
      ...insertResults.map(r => ({ id: r.id, ok: r.ok, originalIdx: r.originalIdx })),
    ]

    const errors = results.filter(r => !r.ok).length
    return NextResponse.json({ results, errors })
  } catch (err) {
    console.error('[POST /api/actors/[id]/filmography/bulk]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
