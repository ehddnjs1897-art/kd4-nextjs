import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { sendSMS } from '@/lib/sms'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

/* ── Meta Conversions API (CAPI) ──────────────────────────────────────
 * iOS14 ATT 이후 클라이언트 픽셀 단독 추적은 30%+ 누락. 서버에서 직접
 * 동일 이벤트 전송해 광고 매칭률 회복. PII는 SHA-256 해싱 후 송신.
 * ──────────────────────────────────────────────────────────────────── */
function sha256(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  // 한국 번호: 010xxxx → 82010xxxx (국가코드 추가, 앞 0 제거)
  if (digits.startsWith('0')) return '82' + digits.slice(1)
  return digits
}

async function sendMetaCAPI(record: { name?: string | null; phone?: string | null; email?: string | null }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  const token = process.env.META_CAPI_TOKEN?.trim()
  if (!pixelId || !token) return  // env 없으면 silent skip — 운영자 직접 추가

  const userData: Record<string, string[]> = {}
  if (record.phone) userData.ph = [sha256(normalizePhone(record.phone))]
  if (record.email) userData.em = [sha256(record.email)]
  if (record.name) userData.fn = [sha256(record.name)]

  if (Object.keys(userData).length === 0) return  // PII 없으면 매칭 의미 없음

  const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [{
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: 'https://kd4.club/join',
        action_source: 'website',
        user_data: userData,
      }],
      access_token: token,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[notify] Meta CAPI 실패:', res.status, body)
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const record = data?.record ?? data

    // 1. Supabase에 무조건 먼저 기록 — webhook·SMS 실패와 무관하게 데이터 보존
    let savedId: string | null = null
    try {
      const { data: inserted, error } = await getSupabaseAdmin()
        .from('consultations')
        .insert({
          name: record?.name ?? null,
          phone: record?.phone ?? null,
          email: record?.email ?? null,
          class_name: record?.class_name ?? null,
          source: record?.source ?? null,
          inquiry_type: record?.inquiry_type ?? null,
          motivation: record?.motivation ?? null,
          status: record?.status ?? '대기',
          raw_payload: record,
        })
        .select('id')
        .single()

      if (error) throw error
      savedId = inserted?.id ?? null
    } catch (dbError) {
      console.error('[notify] Supabase insert 실패:', dbError, record)
    }

    // 2. Make webhook 발송 (실패해도 데이터는 이미 Supabase에 보존됨)
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch((err) => console.error('[notify] Make webhook 실패:', err))
    }

    // 3. 관리자 SMS 발송 (실패해도 데이터는 이미 Supabase에 보존됨)
    const adminPhone = process.env.ADMIN_PHONE_NUMBER
    if (adminPhone && record) {
      const { name, phone, class_name } = record
      const msg = `[KD4 신규상담] ${name} / ${phone}${class_name ? ` / ${class_name}` : ''}`
      sendSMS(adminPhone, msg).catch((err) =>
        console.error('[notify] 관리자 SMS 실패:', err)
      )
    }

    // 4. Meta CAPI (서버사이드 Lead 이벤트) — iOS14 ATT 추적 누락 회복
    if (record) {
      sendMetaCAPI(record).catch((err) =>
        console.error('[notify] Meta CAPI 실패:', err)
      )
    }

    return NextResponse.json({ ok: true, id: savedId })
  } catch (err) {
    console.error('[notify] route 처리 실패:', err)
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
