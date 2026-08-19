/**
 * /api/admin/approve-crew?uid=XXX
 * - GET : 확인 페이지(승인 버튼) — 이메일 링크 클릭만으로는 실행되지 않음 (2026-08-12: 링크 유도 CSRF 차단)
 * - POST: 실제 승인 — 로그인한 관리자(admin)만, 자사 Origin만
 * 기존 이메일 링크(GET)는 그대로 열리며 버튼 1번 더 누르는 흐름으로 바뀐다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/sms'
import { SITE_URL } from '@/lib/constants'

// 관리자별 승인 레이트 리밋: 60초 내 중복 클릭 차단 (이메일 링크 중복 클릭 방어)
const approveCrewMap = new Map<string, number>()
const APPROVE_COOLDOWN_MS = 60_000

async function approve(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Host-header 스푸핑 방지: 리다이렉트 base는 항상 SITE_URL 고정 (open redirect 방어)
  const origin = SITE_URL
  const uid = searchParams.get('uid')

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uid || !UUID_RE.test(uid)) {
    return NextResponse.redirect(`${origin}/admin?error=invalid_uid`)
  }

  // CSRF 방어: POST는 자사 Origin이 아니면 차단 (확인 페이지의 form에서만 호출됨)
  const csrfOrigin = request.headers.get('origin') ?? ''
  if (!csrfOrigin) {
    return NextResponse.redirect(`${origin}/admin?error=csrf`)
  }
  // Exact match — startsWith would allow kd4.club.evil.com subdomain bypass
  if (csrfOrigin && csrfOrigin !== SITE_URL && csrfOrigin !== SITE_URL.replace(/\/$/, '')) {
    return NextResponse.redirect(`${origin}/admin?error=csrf`)
  }

  // 실질적인 보안 게이트: getUser() + admin 역할 확인 (아래)
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()

  if (authErr || !user) {
    // 로그인 안 된 경우 → /admin으로 보냄 (API route를 next로 쓰면 로그인 후 JSON이 노출됨)
    // 로그인 후 이메일 링크를 다시 클릭하면 정상 처리됨
    return NextResponse.redirect(
      `${origin}/auth/login?next=${encodeURIComponent('/admin')}`
    )
  }

  // admin 프로필 + 대상 유저 정보 병렬 조회 (두 쿼리 독립적 — user.id vs uid)
  const [{ data: profile }, { data: target }] = await Promise.all([
    supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabaseAdmin.from('profiles').select('role, name, email, phone').eq('id', uid).maybeSingle(),
  ])

  if (!profile || profile.role !== 'admin') {
    return NextResponse.redirect(`${origin}/?error=not_admin`)
  }

  // 레이트 리밋: 60초 내 동일 대상(uid) 중복 승인 차단 (이메일 링크 중복 클릭·동시 요청 방어)
  const nowAC = Date.now()
  const lastAC = approveCrewMap.get(uid) ?? 0
  if (nowAC - lastAC < APPROVE_COOLDOWN_MS) {
    return NextResponse.redirect(`${origin}/admin?error=rate_limited`)
  }
  approveCrewMap.set(uid, nowAC)
  if (approveCrewMap.size > 2000) {
    for (const [k, ts] of approveCrewMap) {
      if (nowAC - ts > APPROVE_COOLDOWN_MS) approveCrewMap.delete(k)
    }
  }

  if (!target) {
    return NextResponse.redirect(`${origin}/admin?error=user_not_found`)
  }

  // 이미 승인된 경우 — 재실행 방지 (DB 쓰기·SMS 중복 방지)
  if (target.role === 'crew' || target.role === 'director') {
    return NextResponse.redirect(
      `${origin}/admin?already_approved=${encodeURIComponent(target.name ?? uid)}`
    )
  }

  // 승인 대상 역할 매핑 — 신청 상태만 처리
  const APPROVE_MAP: Record<string, { role: string; label: string }> = {
    crew_pending: { role: 'crew', label: '크루' },
    director_pending: { role: 'director', label: '디렉터' },
  }
  const mapped = APPROVE_MAP[target.role ?? '']
  if (!mapped) {
    return NextResponse.redirect(`${origin}/admin?error=invalid_role`)
  }

  // 원자적 업데이트: role이 여전히 pending 상태일 때만 실행 (TOCTOU 방지, SMS 중복 방지)
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: mapped.role })
    .eq('id', uid)
    .in('role', ['crew_pending', 'director_pending'])
    .select('id')
    .maybeSingle()

  if (updateErr) {
    console.error('[approve-crew] 업데이트 오류:', updateErr.message)
    return NextResponse.redirect(`${origin}/admin?error=update_failed`)
  }
  if (!updated) {
    // 동시 요청에서 이미 승인됨 — 멱등적으로 처리
    return NextResponse.redirect(
      `${origin}/admin?already_approved=${encodeURIComponent(target.name ?? uid)}`
    )
  }
  // 역할 변경 후 대시보드 캐시 무효화 (캐시된 권한 정보 갱신)
  revalidatePath('/dashboard')

  // 사용자에게 승인 SMS 알림 (trally 패턴 — 양방향 알림)
  if (target.phone) {
    // 제어문자(개행 등) 제거 — DB 저장 이름이 구버전에 무해 문자 포함 가능 (SMS 포맷 파괴 방지)
    const safeName = (target.name ?? '').replace(/[\r\n\t]/g, ' ')
    const msg =
      mapped.role === 'director'
        ? `[KD4] 디렉터 승인 완료\n${safeName}님, 디렉터 권한이 승인되었습니다.\n배우 연락처 열람·프로필 다운로드가 가능합니다.`
        : `[KD4] 크루 승인 완료\n${safeName}님, KD4 크루 권한이 승인되었습니다.\n커뮤니티·배우 DB·대본 분석 이용 가능합니다.`
    sendSMS(target.phone.replace(/[\r\n\t]/g, ''), msg).catch((err: unknown) =>
      console.error('[approve-crew] SMS 실패:', err instanceof Error ? err.message : '알 수 없는 오류')
    )
  }

  // 관리자 패널로 리디렉트 (성공 메시지 포함)
  return NextResponse.redirect(
    `${origin}/admin?approved=${encodeURIComponent(target.name ?? uid)}`,
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

function confirmPage(uid: string) {
  const safeUid = uid.replace(/[^0-9a-fA-F-]/g, '')
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>크루/디렉터 승인 확인 | KD4</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#F0F0E8;color:#111;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}main{background:#fff;border:1px solid #e5e2d8;border-radius:12px;padding:32px 28px;max-width:420px;width:calc(100% - 32px);text-align:center}h1{font-size:1.1rem;margin:0 0 10px}p{font-size:.9rem;color:#555;line-height:1.6;margin:0 0 22px}button{background:#15488A;color:#fff;border:0;border-radius:8px;padding:12px 24px;font-size:.95rem;min-height:44px;cursor:pointer}a{display:inline-block;margin-top:14px;font-size:.85rem;color:#666}</style></head>
<body><main><h1>회원 승인을 진행할까요?</h1><p>관리자 계정으로 로그인된 상태에서만 처리됩니다.<br>아래 버튼을 누르면 신청 상태의 회원이 크루/디렉터로 승인되고 본인에게 문자가 발송됩니다.</p>
<form method="POST" action="/api/admin/approve-crew?uid=${safeUid}"><button type="submit">승인 진행</button></form>
<a href="/admin">취소하고 관리자 페이지로</a></main></body></html>`
}

export async function GET(request: NextRequest) {
  const uid = new URL(request.url).searchParams.get('uid') ?? ''
  if (!/^[0-9a-fA-F-]{36}$/.test(uid)) {
    return NextResponse.redirect(`${SITE_URL}/admin?error=invalid_uid`)
  }
  return new NextResponse(confirmPage(uid), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: NextRequest) {
  return approve(request)
}
