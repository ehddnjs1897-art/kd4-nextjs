/**
 * POST /api/notify — 공개 상담 접수 엔드포인트 (인증 불요)
 *
 * ⚠️ 의도적으로 인증 없이 공개 — 광고 랜딩 폼에서 비로그인 방문자가 직접 호출.
 * getSupabaseAdmin()은 rate-limit 카운트 조회(read-only)에만 사용.
 * write 작업(consultations INSERT)도 포함되나 검증된 입력값에 대해서만 수행.
 * 보안은 전화번호 기반 + IP 기반 이중 레이트 리밋으로 대체.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { sendSMS } from '@/lib/sms'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/constants'

/* ── Meta Conversions API (CAPI) ──────────────────────────────────────
 * iOS14 ATT 이후 클라이언트 픽셀 단독 추적은 30%+ 누락. 서버에서 직접
 * 동일 이벤트 전송해 광고 매칭률 회복. PII는 SHA-256 해싱 후 송신.
 * ──────────────────────────────────────────────────────────────────── */
function sha256(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

// Make.com 웹훅 URL 호스트 허용 목록 검증 (SSRF 방어)
function isWebhookUrlSafe(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && /(?:^|\.)make\.com$/.test(u.hostname)
  } catch { return false }
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
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      data: [{
        event_name: 'Lead',
        // 클라이언트 픽셀 Lead 와 동일 event_id → Meta 중복제거(dedup). 없으면 미전송(서버 단독 집계)
        // event_id: strip non-alphanumeric chars to prevent dedup key injection
        ...(typeof record.event_id === 'string' && record.event_id
          ? { event_id: record.event_id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) }
          : {}),
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: `${SITE_URL}/join`,
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

// 인메모리 디바운스 — DB count는 비원자적이라 동시 요청 경쟁 조건 발생 가능
// Vercel Serverless: 인스턴스 재시작 시 초기화되나 단일 인스턴스 내 동시성은 차단
const notifyPhoneMap = new Map<string, number>()
const NOTIFY_DEBOUNCE_MS = 4000 // 4초 내 동일 번호 동시 요청 차단

// 허용 출처 — kd4.club 및 로컬 개발 환경만 허용 (cross-origin 스팸 제출 방어)
const NOTIFY_ALLOWED_ORIGINS = new Set([
  'https://kd4.club',
  'https://www.kd4.club',
  'http://localhost:3000',
])

export async function POST(request: NextRequest) {
  try {
    // Origin 검증 — 브라우저 요청만 허용 (null/undefined = non-browser server-to-server OK)
    const origin = request.headers.get('origin')
    if (origin && !NOTIFY_ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json({ error: '허용되지 않는 출처입니다.' }, { status: 403 })
    }

    // 본문 크기 검증 (DoS 방어 — 폼 제출은 최대 수 KB)
    const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
    if (contentLength > 65_536) {
      return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any> = {}
    try {
      data = await request.json()
    } catch {
      return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
    }
    const record = data?.record ?? data

    // 필수 필드 검증 — 상담 폼은 항상 name + phone 포함
    const name = typeof record?.name === 'string' ? record.name.trim().slice(0, 100) : null
    const phone = typeof record?.phone === 'string' ? record.phone.trim().slice(0, 20) : null
    if (!name || !phone) {
      return NextResponse.json({ error: '이름과 연락처는 필수입니다.' }, { status: 400 })
    }
    // 연락처 형식 검증 (한국 번호 — 공백/하이픈 허용)
    if (!/^01[0-9][\-\s]?\d{3,4}[\-\s]?\d{4}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)' }, { status: 400 })
    }
    // 이메일 필수 (JoinForm에서 필수 필드 — 서버도 동일하게 강제)
    const emailRaw = typeof record?.email === 'string' ? record.email.trim() : null
    if (!emailRaw) {
      return NextResponse.json({ error: '이메일은 필수입니다.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return NextResponse.json({ error: '이메일 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    // 인메모리 디바운스 — 동일 번호 동시 요청 중복 차단 (DB count 비원자적 보완)
    // 전화번호 raw 대신 sha256 해시로 키잉 (heap dump PII 노출 방지)
    const phoneHash = sha256(phone)
    const lastSubmit = notifyPhoneMap.get(phoneHash) ?? 0
    if (Date.now() - lastSubmit < NOTIFY_DEBOUNCE_MS) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    notifyPhoneMap.set(phoneHash, Date.now())
    // 오래된 항목 정리 (메모리 누수 방지 — 디바운스 창 경과 항목 삭제)
    if (notifyPhoneMap.size > 500) {
      const cutoff = Date.now() - NOTIFY_DEBOUNCE_MS
      for (const [k, v] of notifyPhoneMap) {
        if (v < cutoff) notifyPhoneMap.delete(k)
      }
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
    // IP 기반 2차 레이트 리밋 — 번호 열거 공격 방어 (5분 내 5회)
    // x-real-ip만 사용 — x-forwarded-for는 클라이언트 위조 가능 → 레이트 리밋 우회 방지
    const ip = request.headers.get('x-real-ip') ?? null
    // Vercel 프로덕션에서 x-real-ip 누락은 프록시 오류 → fail-closed (번호 열거 공격 방어)
    if (!ip && process.env.VERCEL === '1') {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    if (ip) {
      const { count: ipCount } = await getSupabaseAdmin()
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('raw_payload->>ip', ip)
        .gte('created_at', fiveMinAgo)
      if ((ipCount ?? 0) >= 5) {
        return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
      }
    }

    // 1. Supabase에 무조건 먼저 기록 — webhook·SMS 실패와 무관하게 데이터 보존
    let savedId: string | null = null
    const baseRecord = {
      // 이미 검증·슬라이스된 변수를 사용 (record?.* 원본은 길이 미제한)
      name: name,
      phone: phone,
      email: emailRaw,
      class_name: typeof record?.class_name === 'string' ? record.class_name.trim().slice(0, 100) : null,
      source: typeof record?.source === 'string' ? record.source.trim().slice(0, 100) : null,
      inquiry_type: typeof record?.inquiry_type === 'string' ? record.inquiry_type.trim().slice(0, 100) : null,
      motivation: typeof record?.motivation === 'string' ? record.motivation.trim().slice(0, 2000) : null,
      status: (['대기', '확인', '완료'] as const).includes(record?.status as '대기' | '확인' | '완료') ? record.status : '대기',
      // raw_payload: 알려진 필드만 — 임의 extra 필드 저장 방지 (DoS / injection)
      raw_payload: {
        name, phone, email: emailRaw,
        ip,  // IP 레이트 리밋 쿼리와 일치 (raw_payload->>ip)
        class_name: typeof record?.class_name === 'string' ? record.class_name.trim().slice(0, 100) : null,
        source: typeof record?.source === 'string' ? record.source.trim().slice(0, 100) : null,
        inquiry_type: typeof record?.inquiry_type === 'string' ? record.inquiry_type.trim().slice(0, 100) : null,
        motivation: typeof record?.motivation === 'string' ? record.motivation.trim().slice(0, 2000) : null,
        utm_source: typeof record?.utm_source === 'string' ? record.utm_source.trim().slice(0, 200) : null,
        utm_medium: typeof record?.utm_medium === 'string' ? record.utm_medium.trim().slice(0, 200) : null,
        utm_campaign: typeof record?.utm_campaign === 'string' ? record.utm_campaign.trim().slice(0, 200) : null,
        utm_content: typeof record?.utm_content === 'string' ? record.utm_content.trim().slice(0, 200) : null,
        utm_term: typeof record?.utm_term === 'string' ? record.utm_term.trim().slice(0, 200) : null,
        referrer: typeof record?.referrer === 'string' ? record.referrer.trim().slice(0, 500) : null,
        status: typeof record?.status === 'string' ? record.status.trim().slice(0, 50) : '대기',
      },
    }
    // UTM 컬럼(DB 상위 레벨) — raw_payload 내부와 동일 패턴으로 sanitize
    const utmFields = {
      utm_source: typeof record?.utm_source === 'string' ? record.utm_source.trim().slice(0, 200) : null,
      utm_medium: typeof record?.utm_medium === 'string' ? record.utm_medium.trim().slice(0, 200) : null,
      utm_campaign: typeof record?.utm_campaign === 'string' ? record.utm_campaign.trim().slice(0, 200) : null,
      utm_content: typeof record?.utm_content === 'string' ? record.utm_content.trim().slice(0, 200) : null,
      utm_term: typeof record?.utm_term === 'string' ? record.utm_term.trim().slice(0, 200) : null,
      referrer: typeof record?.referrer === 'string' ? record.referrer.trim().slice(0, 500) : null,
    }
    try {
      // UTM 컬럼 포함 시도 — Supabase migration(2026-05-14_utm_tracking.sql) 실행 후 완전 작동
      const { data: inserted, error } = await getSupabaseAdmin()
        .from('consultations')
        .insert({ ...baseRecord, ...utmFields })
        .select('id')
        .maybeSingle()

      if (error) {
        // UTM 컬럼 미존재 시 fallback — 신청 데이터 손실 방지
        if (error.message?.includes('column') || error.code === '42703') {
          console.warn('[notify] UTM 컬럼 없음 — fallback insert (마이그레이션 미실행)')
          const { data: fallback, error: fallbackErr } = await getSupabaseAdmin()
            .from('consultations')
            .insert(baseRecord)
            .select('id')
            .maybeSingle()
          if (fallbackErr) throw fallbackErr
          savedId = fallback?.id ?? null
        } else {
          throw error
        }
      } else {
        savedId = inserted?.id ?? null
      }
    } catch (dbError) {
      // PII 제거 — Vercel 로그에 개인정보 평문 저장 방지
      console.error('[notify] Supabase insert 실패:', dbError instanceof Error ? dbError.message : (dbError as { message?: string })?.message ?? String(dbError), {
        phone: typeof record?.phone === 'string' ? record.phone.slice(0, 3) + '****' : null,
        name: '[redacted]', email: '[redacted]',
      })
    }

    // 2. Make webhook 발송 — await 로 변경 (2026-05-13)
    //   이전: fire-and-forget → Vercel serverless cold start 시점에 함수 종료가 빨라
    //   background fetch 가 발사되지 못함 (5/11 안현빈, 5/12 최문일 새벽 신청 누락 사고).
    //   이제 응답 전 webhook 완료 대기. 단 webhook 자체가 실패해도 Supabase 데이터는 보존됨.
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (webhookUrl && isWebhookUrlSafe(webhookUrl)) {
      // 선택 필드 trim + length cap → 오염된 입력이 Make 시나리오에 그대로 흘러들어가지 않도록
      const sanitizedPayload = {
        name,
        phone,
        email: emailRaw,
        class_name: typeof record?.class_name === 'string' ? record.class_name.trim().slice(0, 100) : null,
        source: typeof record?.source === 'string' ? record.source.trim().slice(0, 100) : null,
        inquiry_type: typeof record?.inquiry_type === 'string' ? record.inquiry_type.trim().slice(0, 100) : null,
        motivation: typeof record?.motivation === 'string' ? record.motivation.trim().slice(0, 2000) : null,
        utm_source: typeof record?.utm_source === 'string' ? record.utm_source.trim().slice(0, 200) : null,
        utm_medium: typeof record?.utm_medium === 'string' ? record.utm_medium.trim().slice(0, 200) : null,
        utm_campaign: typeof record?.utm_campaign === 'string' ? record.utm_campaign.trim().slice(0, 200) : null,
        utm_content: typeof record?.utm_content === 'string' ? record.utm_content.trim().slice(0, 200) : null,
        utm_term: typeof record?.utm_term === 'string' ? record.utm_term.trim().slice(0, 200) : null,
        referrer: typeof record?.referrer === 'string' ? record.referrer.trim().slice(0, 500) : null,
        status: typeof record?.status === 'string' ? record.status.trim().slice(0, 50) : '대기',
        ...(savedId ? { id: savedId } : {}),
      }
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedPayload),
          // 10초 후 timeout (Make 처리 평균 5~8초)
          signal: AbortSignal.timeout(10000),
        })
      } catch (err) {
        console.error('[notify] Make webhook 실패:', err instanceof Error ? err.message : String(err))
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
        // PII 제거: String(err)은 에러 메시지에 전화번호 포함 가능 → err.message만 사용
        console.error('[notify] 관리자 SMS 실패:', err instanceof Error ? err.message : '알 수 없는 오류')
      )
    }

    // 4. Meta CAPI (서버사이드 Lead 이벤트) — iOS14 ATT 추적 누락 회복
    if (record) {
      await sendMetaCAPI(record).catch((err) =>
        console.error('[notify] Meta CAPI 실패:', err instanceof Error ? err.message : String(err))
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notify] route 처리 실패:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
