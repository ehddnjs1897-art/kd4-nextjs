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

async function sendMetaCAPI(record: { name?: string | null; phone?: string | null; email?: string | null; event_id?: string | null }) {
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
        // 클라이언트 픽셀 Lead 와 동일 event_id → Meta 중복제거(dedup). 없으면 미전송(서버 단독 집계)
        ...(record.event_id ? { event_id: record.event_id } : {}),
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

    // 필수 필드 검증 — 상담 폼은 항상 name + phone 포함
    const name = typeof record?.name === 'string' ? record.name.trim().slice(0, 100) : null
    const phone = typeof record?.phone === 'string' ? record.phone.trim().slice(0, 20) : null
    if (!name || !phone) {
      return NextResponse.json({ error: '이름과 연락처는 필수입니다.' }, { status: 400 })
    }

    // Rate limit: 동일 연락처로 5분 내 3회 초과 차단 (SMS 비용 폭탄 방지)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count } = await getSupabaseAdmin()
      .from('consultations')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', fiveMinAgo)
    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    // 1. Supabase에 무조건 먼저 기록 — webhook·SMS 실패와 무관하게 데이터 보존
    let savedId: string | null = null
    const baseRecord = {
      name: record?.name ?? null,
      phone: record?.phone ?? null,
      email: record?.email ?? null,
      class_name: record?.class_name ?? null,
      source: record?.source ?? null,
      inquiry_type: record?.inquiry_type ?? null,
      motivation: record?.motivation ?? null,
      status: record?.status ?? '대기',
      raw_payload: record,
    }
    const utmFields = {
      utm_source: record?.utm_source ?? null,
      utm_medium: record?.utm_medium ?? null,
      utm_campaign: record?.utm_campaign ?? null,
      utm_content: record?.utm_content ?? null,
      utm_term: record?.utm_term ?? null,
      referrer: record?.referrer ?? null,
    }
    try {
      // UTM 컬럼 포함 시도 — Supabase migration(2026-05-14_utm_tracking.sql) 실행 후 완전 작동
      const { data: inserted, error } = await getSupabaseAdmin()
        .from('consultations')
        .insert({ ...baseRecord, ...utmFields })
        .select('id')
        .single()

      if (error) {
        // UTM 컬럼 미존재 시 fallback — 신청 데이터 손실 방지
        if (error.message?.includes('column') || error.code === '42703') {
          console.warn('[notify] UTM 컬럼 없음 — fallback insert (마이그레이션 미실행)')
          const { data: fallback, error: fallbackErr } = await getSupabaseAdmin()
            .from('consultations')
            .insert(baseRecord)
            .select('id')
            .single()
          if (fallbackErr) throw fallbackErr
          savedId = fallback?.id ?? null
        } else {
          throw error
        }
      } else {
        savedId = inserted?.id ?? null
      }
    } catch (dbError) {
      console.error('[notify] Supabase insert 실패:', dbError, record)
    }

    // 2. Make webhook 발송 — await 로 변경 (2026-05-13)
    //   이전: fire-and-forget → Vercel serverless cold start 시점에 함수 종료가 빨라
    //   background fetch 가 발사되지 못함 (5/11 안현빈, 5/12 최문일 새벽 신청 누락 사고).
    //   이제 응답 전 webhook 완료 대기. 단 webhook 자체가 실패해도 Supabase 데이터는 보존됨.
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
          // 10초 후 timeout (Make 처리 평균 5~8초)
          signal: AbortSignal.timeout(10000),
        })
      } catch (err) {
        console.error('[notify] Make webhook 실패:', err)
      }
    }

    // 3. 관리자 SMS 발송 (실패해도 데이터는 이미 Supabase에 보존됨)
    const adminPhone = process.env.ADMIN_PHONE_NUMBER
    if (adminPhone && record) {
      // 제어문자(개행 등) 제거 — SMS 포맷 파괴 방지
      const safeName = name.replace(/[\r\n\t]/g, ' ')
      const safePhone = phone.replace(/[\r\n\t]/g, '')
      const safeClass = typeof record.class_name === 'string'
        ? record.class_name.replace(/[\r\n\t]/g, ' ').slice(0, 50)
        : null
      const msg = `[KD4 신규상담] ${safeName} / ${safePhone}${safeClass ? ` / ${safeClass}` : ''}`
      await sendSMS(adminPhone, msg).catch((err) =>
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
