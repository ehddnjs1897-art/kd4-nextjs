import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/sms'
import { SITE_URL } from '@/lib/constants'

/**
 * 비밀번호 재설정 링크를 "문자(SMS)"로 발송.
 *
 * 배경(2026-07-22 대표 지시): 기존 이메일 재설정은 Supabase 기본 SMTP 제한으로
 * 메일이 사실상 도착하지 않는데 화면은 "발송했습니다"라고 안내 — 허위 안내 상태.
 * 별도 메일서버(Resend) 연결은 DNS 작업 대기 중이라, 이미 안정 가동 중인
 * Solapi 문자로 재설정 링크를 보내는 방식으로 전환 (배우 멤버는 문자가 더 확실).
 *
 * 보안:
 * - 이메일+휴대폰 "둘 다" 등록 정보와 일치해야 발송 (한 가지만으론 불가 — 무차별 시도 차단)
 * - 발송 목적지는 사용자가 입력한 번호가 아니라 DB에 등록된 번호
 * - 같은 이메일 60초 쿨다운 (서버리스 인스턴스별 best-effort)
 */

export const dynamic = 'force-dynamic'

const cooldown = new Map<string, number>()
const COOLDOWN_MS = 60_000

const digits = (s: string) => s.replace(/\D/g, '')
const maskPhone = (p: string) => {
  const d = digits(p)
  return d.length >= 10 ? `${d.slice(0, 3)}-****-${d.slice(-4)}` : '등록된 번호'
}

export async function POST(req: Request) {
  let body: { email?: unknown; phone?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phoneInput = typeof body.phone === 'string' ? digits(body.phone) : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phoneInput.length < 9 || phoneInput.length > 11) {
    return NextResponse.json({ ok: false, error: '이메일과 휴대폰 번호를 정확히 입력해 주세요.' }, { status: 400 })
  }

  const last = cooldown.get(email)
  if (last && Date.now() - last < COOLDOWN_MS) {
    return NextResponse.json({ ok: false, error: '잠시 후 다시 시도해 주세요. (1분 간격)' }, { status: 429 })
  }

  // 이메일로 계정 찾기 — GoTrue admin listUsers의 email 필터는 미지원 버전이 있어 페이지 순회로 매칭
  let userId: string | null = null
  for (let page = 1; page <= 5 && !userId; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      console.error('[reset-sms] listUsers 실패:', error.message)
      return NextResponse.json({ ok: false, error: '일시적인 오류입니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === email)
    if (hit) userId = hit.id
    if (data.users.length < 1000) break
  }

  // 등록 전화번호 후보: profiles.phone + (연결된 배우가 있으면) actors.phone
  const candidates: string[] = []
  if (userId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('phone, actor_id')
      .eq('id', userId)
      .maybeSingle()
    if (profile?.phone) candidates.push(digits(profile.phone))
    if (profile?.actor_id) {
      const { data: actor } = await supabaseAdmin
        .from('actors')
        .select('phone')
        .eq('id', profile.actor_id)
        .maybeSingle()
      if (actor?.phone) candidates.push(digits(actor.phone))
    }
  }

  const matched = candidates.find((c) => c && c === phoneInput)
  if (!userId || !matched) {
    // 계정 없음 / 번호 불일치 / 번호 미등록 — 같은 문구로 통일 (계정 존재 여부 노출 방지)
    return NextResponse.json(
      { ok: false, error: '가입 이메일과 등록된 휴대폰 번호가 일치하지 않습니다. 확인 후 다시 시도하시거나 010-8564-0244로 문의해 주세요.' },
      { status: 400 },
    )
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${SITE_URL}/auth/update-password` },
  })
  const actionLink = linkData?.properties?.action_link
  if (linkError || !actionLink) {
    console.error('[reset-sms] generateLink 실패:', linkError?.message)
    return NextResponse.json({ ok: false, error: '일시적인 오류입니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }

  const text = [
    '[KD4 액팅 스튜디오]',
    '비밀번호 재설정 링크입니다. 1시간 안에 눌러주세요.',
    '',
    actionLink,
    '',
    '본인이 요청하지 않았다면 이 문자는 무시하셔도 됩니다.',
  ].join('\n')

  const sent = await sendSMS(matched, text)
  if (!sent) {
    return NextResponse.json({ ok: false, error: '문자 발송에 실패했습니다. 잠시 후 다시 시도하시거나 010-8564-0244로 문의해 주세요.' }, { status: 500 })
  }

  cooldown.set(email, Date.now())
  return NextResponse.json({ ok: true, maskedPhone: maskPhone(matched) })
}
