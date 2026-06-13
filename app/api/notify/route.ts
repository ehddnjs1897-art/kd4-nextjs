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

/* ── 노션 상담자 DB 자동 row 생성 ─────────────────────────────────────
 * KD4 상담자 현황 DB(e4f5f376-3214-4e18-8deb-b2ab1e5dd9da)에 상담 신청을
 * 자동 동기화. 본문엔 통화 메모 + 등록 확정 메시지 템플릿 미리 주입.
 * env(NOTION_TOKEN) 없으면 silent skip — 다른 기능에 영향 0.
 * 노션 API 실패해도 throw X — 로깅만 (Supabase 데이터는 이미 보존됨).
 * ──────────────────────────────────────────────────────────────────── */
const NOTION_DATABASE_ID = 'e4f5f376-3214-4e18-8deb-b2ab1e5dd9da'

// source 값 → 노션 상담자 DB(🧭 KD4 상담자 현황) '유입경로' 고정 Select 옵션으로 매핑.
// ⚠️ 실제 노션 옵션과 정확히 일치시켜야 함 — 불일치 시 옵션 난립(자동 생성).
// 옵션: 📸 인스타그램 / 🤖 AI 추천 / 🔗 /join 랜딩 / 📣 메타광고 / 💛 카카오 / 👥 지인소개 / 🥕 당근 / 🎪 오픈클래스 / 📌 기타
function mapSourceToNotion(source: string | null): string | null {
  if (!source) return null
  const s = source.toLowerCase()
  if (s.includes('인스타') || s.includes('instagram')) return '📸 인스타그램'
  if (s.includes('메타') || s.includes('meta') || s.includes('facebook') || s.includes('fb') || s.includes('광고')) return '📣 메타광고'
  if (s.includes('/join') || s.includes('랜딩') || s.includes('landing')) return '🔗 /join 랜딩'
  if (s.includes('카카오') || s.includes('kakao')) return '💛 카카오'
  if (s.includes('당근')) return '🥕 당근'
  if (s.includes('지인') || s.includes('소개')) return '👥 지인소개'
  if (s.includes('오픈') || s.includes('open')) return '🎪 오픈클래스'
  if (s.includes('ai') || s.includes('추천')) return '🤖 AI 추천'
  return '📌 기타'  // 매칭 안 되면 기타 (옵션 난립 방지)
}

// 희망 클래스명 → 노션 상담자 DB '희망클래스' 고정 Select 옵션 매핑.
// 옵션: 🎬 출연영상 클래스 / 🎭 마이즈너 테크닉 정규 클래스 / 📘 베이직 / 🎯 오디션 테크닉 클래스 /
//       🌙 출연영상 클래스 저녁 / ☀️ 출연영상 클래스 낮 / 출연영상 1달 / 리더클래스 / 취미반 / ❓ 미정
function mapClassToNotion(cls: string | null): string | null {
  if (!cls) return null
  const c = cls.toLowerCase()
  if (c.includes('마이즈너')) return '🎭 마이즈너 테크닉 정규 클래스'
  if (c.includes('오디션')) return '🎯 오디션 테크닉 클래스'
  if (c.includes('베이직') || c.includes('basic')) return '📘 베이직'
  if (c.includes('1달') || c.includes('한달')) return '출연영상 1달'
  if (c.includes('저녁')) return '🌙 출연영상 클래스 저녁'
  if (c.includes('낮')) return '☀️ 출연영상 클래스 낮'
  if (c.includes('출연영상') || c.includes('영상')) return '🎬 출연영상 클래스'
  if (c.includes('리더')) return '리더클래스'
  if (c.includes('취미')) return '취미반'
  return '❓ 미정'
}

async function sendNotionConsultation(payload: {
  name: string
  phone: string
  email: string
  class_name: string | null
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
}) {
  const token = process.env.NOTION_TOKEN?.trim()
  if (!token) return  // env 없으면 silent skip — 사용자가 토큰 만들면 바로 작동

  // UTM 합본 (있는 것만 조합)
  const utmParts = [
    payload.utm_source ? `source=${payload.utm_source}` : null,
    payload.utm_medium ? `medium=${payload.utm_medium}` : null,
    payload.utm_campaign ? `campaign=${payload.utm_campaign}` : null,
  ].filter(Boolean)
  const utmCombined = utmParts.join(' / ')

  const notionSource = mapSourceToNotion(payload.source)

  // 노션 properties — 실제 노션 DB(🧭 KD4 상담자 현황) 스키마에 정확히 일치시킴.
  // ⚠️ property 이름이 DB에 없으면 노션 API가 400 반환 → 동기화 전체 실패(2026-06-13 수정).
  //    실제 컬럼: 이름(title)/연락처(phone)/이메일(email)/상태(select)/접수일(date)/희망클래스(select)/유입경로(select)/유입링크(text)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {
    '이름': {
      title: [{ type: 'text', text: { content: payload.name } }],
    },
    '연락처': { phone_number: payload.phone },
    '이메일': { email: payload.email },
    '상태': { select: { name: '🆕 상담 신청' } },
    '접수일': { date: { start: new Date().toISOString() } },
  }
  const notionClass = mapClassToNotion(payload.class_name)
  if (notionClass) {
    properties['희망클래스'] = { select: { name: notionClass } }
  }
  // 원본 클래스명도 '신청클래스'(text)에 보존 — 매핑이 '❓ 미정'으로 떨어져도 원본 확인 가능
  if (payload.class_name) {
    properties['신청클래스'] = { rich_text: [{ type: 'text', text: { content: payload.class_name.slice(0, 200) } }] }
  }
  if (notionSource) {
    properties['유입경로'] = { select: { name: notionSource } }
  }
  if (utmCombined) {
    properties['유입링크'] = {
      rich_text: [{ type: 'text', text: { content: utmCombined.slice(0, 2000) } }],
    }
  }

  // 페이지 본문 children — 통화 메모 + 등록 확정 메시지 템플릿
  const children = [
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: '📞 통화 후 작성' } }] },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: '등록 클래스: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: '(컬럼에 Select)' } },
        ],
      },
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: '특이사항: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: '(컬럼에 Text)' } },
        ],
      },
    },
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: '📩 등록 확정 메시지 (복붙용)' } }] },
    },
    {
      object: 'block',
      type: 'code',
      code: {
        language: 'plain text',
        rich_text: [
          {
            type: 'text',
            text: {
              content:
                `안녕하세요 배우님\n환영합니다!\n\n` +
                `성함: ${payload.name} 배우님\n` +
                `클래스: ${payload.class_name ?? '{클래스명}'} {기수}기 / {수업요일} {시간대} ({시작월} 시작)\n` +
                `{첫 수업일} {요일} {시간}\n\n` +
                `입금계좌 :  274-910338-13807 ㅣ하나은행 권동원(유익액터스)\n\n` +
                `*첫달 10만원 할인 적용하여, {할인적용가}원 입금후 확인메시지 주세요, 단톡방 초대드리겠습니다.\n` +
                `*3개월분 일시납시 추가할인 5만원적용 됩니다.\n` +
                `*카드결제를 원하시면 수업당일 결제 가능합니다.\n\n` +
                `추가적인 문의는 카카오채널을 통해 남겨주시면 빠르게 답변드리겠습니다.`,
            },
          },
        ],
      },
    },
  ]

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
        children,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      // 노션 API 에러는 throw 하지 않음 — Supabase/Make는 이미 완료된 상태
      console.error('[notify] 노션 row 생성 실패:', res.status, body.slice(0, 500))
    }
  } catch (err) {
    console.error('[notify] 노션 row 생성 실패:', err instanceof Error ? err.message : String(err))
  }
}

// 인메모리 디바운스 — DB count는 비원자적이라 동시 요청 경쟁 조건 발생 가능
// Vercel Serverless: 인스턴스 재시작 시 초기화되나 단일 인스턴스 내 동시성은 차단
const notifyPhoneMap = new Map<string, number>()
const NOTIFY_DEBOUNCE_MS = 4000 // 4초 내 동일 번호 동시 요청 차단

// 허용 출처 — SITE_URL 기반으로 동적 구성 (하드코딩 도메인과 상수 불일치 방지)
const NOTIFY_ALLOWED_ORIGINS = new Set([
  SITE_URL,
  SITE_URL.replace(/^https:\/\//, 'https://www.'),
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
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

    // 서버사이드 허니팟 체크 — 클라이언트 차단 우회 방어 (스펙 2-E)
    // `company` 필드가 비어있어야 실제 사람. 봇은 보통 모든 필드를 채움.
    if (typeof record?.company === 'string' && record.company.trim()) {
      // 봇으로 판단 — 조용히 성공 응답 (봇이 재시도 안 하도록)
      return NextResponse.json({ ok: true, dbSaved: false })
    }

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
    // 이메일: JoinForm 등 기본 상담은 필수. 캐스팅 문의(inquiry_type='casting_inquiry')는 면제.
    // casting_inquiry는 전화 + 작품/역할 정보로 충분 — 마찰 최소화 목적.
    const isCastingInquiry = typeof record?.inquiry_type === 'string' && record.inquiry_type === 'casting_inquiry'
    const emailRaw = typeof record?.email === 'string' ? record.email.trim() : null
    if (!isCastingInquiry) {
      if (!emailRaw) {
        return NextResponse.json({ error: '이메일은 필수입니다.' }, { status: 400 })
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
        return NextResponse.json({ error: '이메일 형식이 올바르지 않습니다.' }, { status: 400 })
      }
    } else if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      // 캐스팅 문의에서도 이메일을 제공했다면 형식 검증
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
    if (notifyPhoneMap.size > 2000) {
      const cutoff = Date.now() - NOTIFY_DEBOUNCE_MS
      for (const [k, v] of notifyPhoneMap) {
        if (v < cutoff) notifyPhoneMap.delete(k)
      }
    }

    // IP 먼저 확인 — Vercel fail-closed (DB 조회 전 차단)
    // x-real-ip만 사용 — x-forwarded-for는 클라이언트 위조 가능 → 레이트 리밋 우회 방지
    const ip = request.headers.get('x-real-ip') ?? null
    if (!ip && process.env.VERCEL === '1') {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    // Rate limit: 연락처 + IP를 병렬 조회 (순차 2 round-trip → 1)
    // 연락처: 5분 내 3회 초과 차단 (SMS 비용 폭탄 방지) / IP: 5분 내 5회 초과 차단 (번호 열거 공격 방어)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const [{ count }, { count: ipCount }] = await Promise.all([
      getSupabaseAdmin()
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('phone', phone)
        .gte('created_at', fiveMinAgo),
      ip
        ? getSupabaseAdmin()
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('raw_payload->>ip', ip)
            .gte('created_at', fiveMinAgo)
        : Promise.resolve({ count: 0, data: null, error: null }),
    ])
    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    if (ip && (ipCount ?? 0) >= 5) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
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
        status: (['대기', '확인', '완료'] as const).includes(record?.status as '대기' | '확인' | '완료') ? record.status : '대기',
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
        status: (['대기', '확인', '완료'] as const).includes(record?.status as '대기' | '확인' | '완료') ? record.status : '대기',
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
      // 캐스팅 문의는 꼬리표 + 배우 source 포함 (일반 상담과 구분)
      const safeSource = isCastingInquiry && typeof record?.source === 'string'
        ? record.source.replace(/[\r\n\t]/g, ' ').slice(0, 50)
        : null
      const tag = isCastingInquiry ? '[KD4 캐스팅문의]' : '[KD4 신규상담]'
      const detail = isCastingInquiry && safeSource
        ? ` / ${safeSource}`
        : safeClass ? ` / ${safeClass}` : ''
      const msg = `${tag} ${safeName} / ${safePhone}${detail}`
      await sendSMS(adminPhone, msg).catch((err) =>
        // PII 제거: String(err)은 에러 메시지에 전화번호 포함 가능 → err.message만 사용
        console.error('[notify] 관리자 SMS 실패:', err instanceof Error ? err.message : '알 수 없는 오류')
      )
    }

    // 3-b. 캐스팅 문의 → 해당 배우 본인에게도 직통 SMS (2026-06-12 대표 지시: 배우 전화번호 동기화)
    //      actors.phone 비어 있으면 자동 스킵. 관리자 SMS(위)는 항상 별도 발송 — 대표도 같이 인지.
    if (isCastingInquiry && record && typeof record.actor_id === 'string'
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.actor_id)) {
      try {
        const { data: inquiredActor } = await getSupabaseAdmin()
          .from('actors')
          .select('name, phone')
          .eq('id', record.actor_id)
          .maybeSingle()
        const actorPhone = (inquiredActor?.phone ?? '').replace(/[^\d]/g, '')
        if (actorPhone.length >= 9) {
          const safeName2 = name.replace(/[\r\n\t]/g, ' ')
          const safePhone2 = phone.replace(/[\r\n\t]/g, '')
          const safeProduction = typeof record.production === 'string' ? record.production.replace(/[\r\n\t]/g, ' ').slice(0, 40) : ''
          const safeRole = typeof record.role === 'string' ? record.role.replace(/[\r\n\t]/g, ' ').slice(0, 30) : ''
          const detail2 = [safeProduction, safeRole].filter(Boolean).join(' · ')
          const actorMsg = `[KD4 캐스팅문의] ${inquiredActor?.name ?? ''}님께 문의 도착 — ${safeName2} ${safePhone2}${detail2 ? ` / ${detail2}` : ''}`
          await sendSMS(actorPhone, actorMsg).catch((err) =>
            console.error('[notify] 배우 직통 SMS 실패:', err instanceof Error ? err.message : '알 수 없는 오류')
          )
        }
      } catch (e) {
        console.error('[notify] 배우 직통 SMS용 배우 조회 실패:', e instanceof Error ? e.message : String(e))
      }
    }

    // 4. Meta CAPI (서버사이드 Lead 이벤트) — iOS14 ATT 추적 누락 회복
    if (record) {
      await sendMetaCAPI({ name, phone, email: emailRaw, event_id: typeof record?.event_id === 'string' ? record.event_id : null }).catch((err) =>
        console.error('[notify] Meta CAPI 실패:', err instanceof Error ? err.message : String(err))
      )
    }

    // 5. 노션 KD4 상담자 현황 DB 자동 row 생성 — 본문 미니멀 템플릿 주입
    //    NOTION_TOKEN 없으면 silent skip. 실패해도 응답에 영향 없음 (Supabase는 이미 보존).
    await sendNotionConsultation({
      name,
      phone,
      email: emailRaw,
      class_name: baseRecord.class_name,
      source: baseRecord.source,
      utm_source: utmFields.utm_source,
      utm_medium: utmFields.utm_medium,
      utm_campaign: utmFields.utm_campaign,
    }).catch((err) =>
      console.error('[notify] 노션 row 생성 실패:', err instanceof Error ? err.message : String(err))
    )

    // dbSaved: Supabase 저장 성공 여부 — 클라이언트에서 Lead와 DB 불일치 모니터링 가능
    return NextResponse.json({ ok: true, dbSaved: savedId !== null })
  } catch (err) {
    console.error('[notify] route 처리 실패:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
