/**
 * GET /api/admin/audit-downloads  — ⚠️ 임시 진단 엔드포인트 (2026-06-24)
 *
 * 배우DB 전체의 프로필 문서·영상이 실제 저장소(Supabase actor-docs / R2)에
 * 존재하는지 프로덕션 런타임에서 전수 점검한다. (R2 키가 Vercel Sensitive라
 * 로컬에선 확인 불가 → 서버에서만 가능)
 *
 * 게이트: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> 일치 시에만.
 * 점검 완료 후 이 파일은 제거한다 (read-only, 비밀 미노출).
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { videoExists, isR2Configured } from '@/lib/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function supaDocExists(path: string): Promise<boolean> {
  const dir = path.split('/').slice(0, -1).join('/')
  const file = path.split('/').pop()!
  const { data } = await supabaseAdmin.storage.from('actor-docs').list(dir, { search: file, limit: 100 })
  return !!data && data.some((o) => o.name === file)
}

export async function GET(request: NextRequest) {
  // 임시 1회용 토큰 게이트 (점검 직후 이 라우트 전체 제거 → 토큰 무의미해짐)
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (token !== 'kd4-dl-audit-7f3a9c21e8b4') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: actors } = await supabaseAdmin
    .from('actors')
    .select('id, name, is_public, profile_doc_path, profile_pdf_url')
  const { data: vids } = await supabaseAdmin
    .from('actor_videos')
    .select('actor_id, r2_key, title')

  const vmap = new Map<string, { r2_key: string | null; title: string | null }[]>()
  for (const v of vids ?? []) {
    const a = vmap.get(v.actor_id) ?? []; a.push(v); vmap.set(v.actor_id, a)
  }

  const r2on = isR2Configured()
  const docBroken: { name: string; pub: boolean; path: string; where: string }[] = []
  const vidBroken: { name: string; pub: boolean; title: string }[] = []
  let docOk = 0, docNone = 0, vidOk = 0, vidTotal = 0

  for (const a of actors ?? []) {
    if (a.profile_doc_path) {
      const inSupa = await supaDocExists(a.profile_doc_path)
      let inR2 = false
      if (!inSupa && r2on) { try { inR2 = await videoExists(a.profile_doc_path) } catch { inR2 = false } }
      if (inSupa || inR2) docOk++
      else docBroken.push({ name: a.name, pub: a.is_public, path: a.profile_doc_path, where: 'missing' })
    } else if (a.profile_pdf_url) {
      docOk++
    } else {
      docNone++
    }
    for (const v of vmap.get(a.id) ?? []) {
      vidTotal++
      let ok = false
      if (v.r2_key && r2on) { try { ok = await videoExists(v.r2_key) } catch { ok = false } }
      if (ok) vidOk++
      else vidBroken.push({ name: a.name, pub: a.is_public, title: v.title ?? v.r2_key ?? '(no key)' })
    }
  }

  return NextResponse.json({
    r2Configured: r2on,
    totals: { actors: actors?.length ?? 0, docOk, docNone, docBroken: docBroken.length, vidTotal, vidOk, vidBroken: vidBroken.length },
    docBroken,
    vidBroken,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
