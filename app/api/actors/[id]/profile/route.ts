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
import { getObjectStream, getObjectMeta, isR2Configured } from '@/lib/r2'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 프로필 다운로드 레이트 리밋: 1분 20회 (R2/Drive egress 남용 방어)
const profileDownloadMap = new Map<string, number[]>()
const PROFILE_DOWNLOAD_WINDOW_MS = 60_000
const PROFILE_DOWNLOAD_MAX = 20

function dispositionHeader(filename: string): string {
  // RFC 5987: 한글 파일명 안전 인코딩
  return `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
}

// 확장자 → MIME 매핑 — R2/외부 소스가 octet-stream으로 응답하면 OS·브라우저 미리보기가
// 파일 형식을 인식 못 해 깨져 보임 (2026-06-12 미리보기 깨짐 수정). 정확한 타입으로 교정.
const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  hwp: 'application/x-hwp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  zip: 'application/zip',
}

/** upstream Content-Type이 없거나 octet-stream이면 확장자 기반으로 교정 */
function resolveContentType(upstreamType: string | null | undefined, ext: string): string {
  if (upstreamType && upstreamType !== 'application/octet-stream' && upstreamType !== 'binary/octet-stream') {
    return upstreamType
  }
  return EXT_MIME[ext.toLowerCase()] ?? 'application/octet-stream'
}

// SSRF 방어: 허용된 호스트만 프록시 대상으로 (내부 주소·IPv6 매핑 IPv4 차단)
// R2 URL은 profile_doc_path 경로(아래)에서 별도 처리 — SSRF 허용 목록에 포함 불요
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
  if (profileDownloadMap.size > 2000) {
    for (const [k, v] of profileDownloadMap) {
      if (v.every(t => nowPD - t > PROFILE_DOWNLOAD_WINDOW_MS)) profileDownloadMap.delete(k)
    }
  }

  const { data: actor } = await supabaseAdmin
    .from('actors')
    .select('name, gender, birth_year, profile_doc_path, profile_pdf_url, is_public')
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
  // 다운로드 파일명: "{OO}년생 {성별} {이름}_프로필" (예: 57년생 여 정애란_프로필, 2026-07-10 대표 지시)
  // 생년/성별 없으면 있는 것만 붙이고 "{이름}_프로필"로 폴백
  const safeGender = (actor.gender || '').replace(/[\r\n"\\]/g, '').trim()
  const birthYear2 = actor.birth_year ? String(actor.birth_year).slice(-2) : ''
  const prefixParts = [birthYear2 && `${birthYear2}년생`, safeGender].filter(Boolean)
  const downloadBase = [...prefixParts, `${safeName}_프로필`].join(' ')

  // path 1: profile_doc_path — 저장 위치가 둘로 갈린다(2026-06-24 다운로드 깨짐 수정):
  //   · 셀프제출(intake/{uid}/...) → Supabase Storage actor-docs 버킷
  //   · 마이그레이션(migrated/...) → R2 비공개 버킷
  // 기존엔 R2에서만 찾아 셀프제출 19명 다운로드가 전부 502였다. Supabase 우선 → R2 폴백으로 양쪽 처리.
  if (actor.profile_doc_path) {
    // 경로 탐색 공격 방지 — DB 값이어도 오염 가능 (admin 실수·직접 수정)
    if (actor.profile_doc_path.split('/').some((seg: string) => seg === '..' || seg === '.')) {
      return NextResponse.json({ error: '잘못된 프로필 경로입니다.' }, { status: 400 })
    }
    const ext = (actor.profile_doc_path.split('?')[0].split('.').pop() || 'pdf').slice(0, 8)

    // 1a. Supabase Storage actor-docs (셀프제출 업로드분) — service_role 직접 다운로드
    const dl = await supabaseAdmin.storage.from('actor-docs').download(actor.profile_doc_path)
    if (dl.data && !dl.error) {
      if (dl.data.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: '프로필 파일이 너무 큽니다.' }, { status: 413 })
      }
      return new Response(dl.data, {
        headers: {
          'Content-Type': resolveContentType(dl.data.type || null, ext),
          'Content-Disposition': dispositionHeader(`${downloadBase}.${ext}`),
          'Cache-Control': 'private, no-store',
        },
      })
    }

    // 1b. R2 비공개 버킷 폴백 (migrated/... 등 R2 저장분)
    if (isR2Configured()) {
      try {
        // 50MB 상한 — 스트림 열기 전에 HeadObject로 확인 (null contentLength bypass 방지)
        const meta = await getObjectMeta(actor.profile_doc_path)
        if (meta.contentLength && meta.contentLength > 50 * 1024 * 1024) {
          return NextResponse.json({ error: '프로필 파일이 너무 큽니다.' }, { status: 413 })
        }
        const obj = await getObjectStream(actor.profile_doc_path)
        const headers: Record<string, string> = {
          'Content-Type': resolveContentType(obj.contentType, ext),
          'Content-Disposition': dispositionHeader(`${downloadBase}.${ext}`),
          'Cache-Control': 'private, no-store',
        }
        if (obj.contentLength) headers['Content-Length'] = String(obj.contentLength)
        return new Response(obj.body, { headers })
      } catch (e) {
        console.error('[actor profile] R2 스트림 실패:', e instanceof Error ? e.message : String(e))
        return NextResponse.json({ error: '프로필 파일을 가져오지 못했습니다.' }, { status: 502 })
      }
    }
    // Supabase·R2 둘 다 미해당 → 아래 외부 URL 또는 404로 폴스루
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
      // 리다이렉트 후 최종 URL 재검증 — DNS rebinding / open-redirect 방어
      if (upstream.url && !isSafeProfileUrl(upstream.url)) {
        return NextResponse.json({ error: '허용되지 않는 프로필 링크입니다.' }, { status: 400 })
      }
      // Content-Length 헤더 기반 사전 차단 (R2 경로의 50MB 가드와 동일 기준)
      const upstreamLength = upstream.headers.get('content-length')
      const MAX_PROXY_BYTES = 50 * 1024 * 1024
      if (upstreamLength && Number(upstreamLength) > MAX_PROXY_BYTES) {
        return NextResponse.json({ error: '파일이 너무 큽니다 (최대 50MB).' }, { status: 413 })
      }
      // 스트림 바이트 카운터 — Content-Length 없는 경우 방어 (50MB 초과 시 스트림 종료)
      let bytesReceived = 0
      const limitedBody = upstream.body.pipeThrough(new TransformStream({
        transform(chunk, controller) {
          bytesReceived += chunk.byteLength
          if (bytesReceived > MAX_PROXY_BYTES) {
            controller.error(new Error('파일 크기 초과'))
          } else {
            controller.enqueue(chunk)
          }
        },
      }))
      const rawExt = target.pathname.split('?')[0].split('.').pop() ?? 'pdf'
      const ext = rawExt.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'pdf'
      const headers: Record<string, string> = {
        'Content-Type': resolveContentType(upstream.headers.get('content-type'), ext),
        'Content-Disposition': dispositionHeader(`${downloadBase}.${ext}`),
        'Cache-Control': 'private, no-store',
      }
      // Content-Length 미전달 — 파일 존재 여부 추론 방지 (사이즈 오라클 방어)
      return new Response(limitedBody, { headers })
    } catch (e) {
      console.error('[actor profile] 외부 URL 프록시 실패:', e instanceof Error ? e.message : String(e))
      return NextResponse.json({ error: '프로필 파일을 가져오지 못했습니다.' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: '등록된 프로필 문서가 없습니다.' }, { status: 404 })
}
