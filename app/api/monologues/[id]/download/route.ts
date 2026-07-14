/**
 * GET /api/monologues/[id]/download
 *
 * 독백 카드 이미지 강제 다운로드 — same-origin 프록시.
 * 독백 아카이브 열람 자체는 비회원도 가능하지만, 다운로드는 로그인 멤버만
 * (2026-07-10 대표 지시). card_image_url을 브라우저에 직접 열면 새 탭에
 * 이미지가 열릴 뿐 다운로드되지 않으므로(크로스오리진 <a download>는 브라우저가
 * 무시) 서버가 받아서 Content-Disposition을 붙여 재서빙한다.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BYTES = 10 * 1024 * 1024

function isSafeCardUrl(raw: string): boolean {
  let url: URL
  try { url = new URL(raw) } catch { return false }
  if (url.protocol !== 'https:') return false
  let supabaseHost = ''
  try { supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname.toLowerCase() } catch { /* ignore */ }
  return !!supabaseHost && url.hostname.toLowerCase() === supabaseHost
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: '잘못된 독백 ID입니다.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: m, error } = await supabaseAdmin
    .from('monologues')
    .select('role, work, card_image_url')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()

  if (error || !m || !m.card_image_url) {
    return NextResponse.json({ error: '독백 카드를 찾을 수 없습니다.' }, { status: 404 })
  }
  if (!isSafeCardUrl(m.card_image_url)) {
    return NextResponse.json({ error: '허용되지 않는 이미지 경로입니다.' }, { status: 400 })
  }

  try {
    const upstream = await fetch(m.card_image_url, { signal: AbortSignal.timeout(15_000) })
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: '이미지를 가져오지 못했습니다.' }, { status: 502 })
    }
    const contentLength = upstream.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_BYTES) {
      return NextResponse.json({ error: '이미지가 너무 큽니다.' }, { status: 413 })
    }

    const ext = m.card_image_url.split('?')[0].split('.').pop()?.toLowerCase() || 'png'
    const safeWork = (m.work || '독백').replace(/[\\/:*?"<>|\r\n]/g, '_').trim()
    const safeRole = (m.role || '').replace(/[\\/:*?"<>|\r\n]/g, '_').trim()
    const filename = `${[safeWork, safeRole].filter(Boolean).join('_')}_독백카드.${ext}`

    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/png',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    console.error('[monologues/download]', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: '다운로드 중 오류가 발생했습니다.' }, { status: 502 })
  }
}
