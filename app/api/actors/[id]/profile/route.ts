/**
 * GET /api/actors/[id]/profile
 *
 * 배우 프로필 문서(PPTX/PDF) 강제 다운로드 — same-origin 프록시.
 *
 * 왜 프록시인가:
 *   R2 presigned URL을 브라우저에 직접 주면, 브라우저가 PDF 등을 inline 렌더하거나
 *   (response-content-disposition 미적용 / 버킷 CORS 미설정) 현재 탭이 R2 URL로
 *   이동해버린다. 우리 서버가 파일을 받아 Content-Disposition: attachment 를 붙여
 *   재서빙하면 same-origin 이라 브라우저가 항상 "다운로드"로 처리한다.
 *
 * 권한: 디렉터(승인)/관리자, 또는 본인. 비공개 프로필은 본인/관리자만.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { canViewActorContact } from '@/lib/access'
import { getObjectStream, isR2Configured } from '@/lib/r2'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 프로필 다운로드 레이트 리밋: 1분 20회 (R2/Drive egress 남용 방어)
const profileDownloadMap = new Map<string, number[]>()
const PROFILE_DOWNLOAD_WINDOW_MS = 60_000
const PROFILE_DOWNLOAD_MAX = 20

function dispositionHeader(filename: string): string {
  // RFC 5987: 한글 파일명 안전 인코딩
  return `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
}

// SSRF 방어: 허용된 호스트만 프록시 대상으로 (내부 주소·IPv6 매핑 IPv4 차단)
const ALLOWED_PROFILE_HOSTS = new Set([
  'drive.google.com',
  'lh3.googleusercontent.com',
  'docs.google.com',
])
function isSafeProfileUrl(raw: string): boolean {
  let url: URL
  try { url = new URL(raw) } catch { return false }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  // IPv6 매핑 IPv4 및 내부 주소 차단
  if (/^\[/.test(host) || /^(localhost|127\.|10\.|169\.254\.|0\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false
  return ALLOWED_PROFILE_HOSTS.has(host)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: '잘못된 배우 ID입니다.' }, { status: 400 })
  }

  // 인증 + 역할 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('role, actor_id').eq('id', user.id).maybeSingle()
  const role = profile?.role ?? null
  const isOwner = profile?.actor_id === id
  const isAdmin = role === 'admin'

  // 다운로드 권한: 디렉터/관리자 또는 본인
  if (!canViewActorContact(role) && !isOwner) {
    return NextResponse.json({ error: '프로필 다운로드 권한이 없습니다.' }, { status: 403 })
  }

  // 레이트 리밋: 1분 20회 (R2/Drive egress 남용 방어)
  const nowPD = Date.now()
  const timesPD = (profileDownloadMap.get(user.id) ?? []).filter(t => nowPD - t < PROFILE_DOWNLOAD_WINDOW_MS)
  if (timesPD.length >= PROFILE_DOWNLOAD_MAX) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  profileDownloadMap.set(user.id, [...timesPD, nowPD])
  if (profileDownloadMap.size > 500) {
    for (const [k, v] of profileDownloadMap) {
      if (v.every(t => nowPD - t > PROFILE_DOWNLOAD_WINDOW_MS)) profileDownloadMap.delete(k)
    }
  }

  const { data: actor } = await supabaseAdmin
    .from('actors')
    .select('name, profile_doc_path, profile_pdf_url, is_public')
    .eq('id', id)
    .maybeSingle()
  if (!actor) {
    return NextResponse.json({ error: '배우를 찾을 수 없습니다.' }, { status: 404 })
  }
  // 비공개 프로필: 본인 또는 관리자만 (디렉터도 비공개는 차단)
  if (!actor.is_public && !isOwner && !isAdmin) {
    return NextResponse.json({ error: '배우를 찾을 수 없습니다.' }, { status: 404 })
  }

  const safeName = (actor.name || 'profile').replace(/[\r\n"\\]/g, '').trim() || 'profile'

  // path 1: R2 비공개 버킷 (profile_doc_path)
  if (actor.profile_doc_path && isR2Configured()) {
    try {
      const ext = (actor.profile_doc_path.split('?')[0].split('.').pop() || 'pdf').slice(0, 8)
      const obj = await getObjectStream(actor.profile_doc_path)
      const headers: Record<string, string> = {
        'Content-Type': obj.contentType || 'application/octet-stream',
        'Content-Disposition': dispositionHeader(`${safeName} 프로필.${ext}`),
        'Cache-Control': 'private, no-store',
      }
      if (obj.contentLength) headers['Content-Length'] = String(obj.contentLength)
      return new Response(obj.body, { headers })
    } catch (e) {
      console.error('[actor profile] R2 스트림 실패:', e)
      return NextResponse.json({ error: '프로필 파일을 가져오지 못했습니다.' }, { status: 502 })
    }
  }

  // path 2: 외부 URL (profile_pdf_url) — 관리자가 직접 등록한 신뢰된 값
  if (actor.profile_pdf_url) {
    // SSRF 방어: 허용된 호스트만 프록시 (2026-05-23 R90)
    if (!isSafeProfileUrl(actor.profile_pdf_url)) {
      return NextResponse.json({ error: '허용되지 않는 프로필 링크입니다.' }, { status: 400 })
    }
    let target: URL
    try {
      target = new URL(actor.profile_pdf_url)
    } catch {
      return NextResponse.json({ error: '잘못된 프로필 링크입니다.' }, { status: 502 })
    }
    try {
      const upstream = await fetch(target, { redirect: 'follow', signal: AbortSignal.timeout(15_000) })
      if (!upstream.ok || !upstream.body) {
        return NextResponse.json({ error: '프로필 파일을 가져오지 못했습니다.' }, { status: 502 })
      }
      const ext = (target.pathname.split('.').pop() || 'pdf').slice(0, 8)
      const headers: Record<string, string> = {
        'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': dispositionHeader(`${safeName} 프로필.${ext}`),
        'Cache-Control': 'private, no-store',
      }
      const len = upstream.headers.get('content-length')
      if (len) headers['Content-Length'] = len
      return new Response(upstream.body, { headers })
    } catch (e) {
      console.error('[actor profile] 외부 URL 프록시 실패:', e)
      return NextResponse.json({ error: '프로필 파일을 가져오지 못했습니다.' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: '등록된 프로필 문서가 없습니다.' }, { status: 404 })
}
