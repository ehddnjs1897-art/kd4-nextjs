/**
 * POST /api/lite-lead — 외부 CTA 클릭 경량 리드 기록 (2026-05-23)
 *
 * 배경: /join 의 카카오 채널·구글폼 링크는 외부 도메인으로 이동하므로
 *       기존 /api/notify (폼 제출 전용) 로는 추적되지 않아 누수 발생.
 *       GA4/Meta 픽셀 CTAClick 이벤트만 발사되고 Supabase consultations 에
 *       흔적이 남지 않아 "상담 의도" 수가 실제보다 과소 집계됨.
 *
 * 처리: 클릭 시 navigator.sendBeacon 으로 이 endpoint 호출 → consultations 에
 *       status='외부CTA클릭' 행 추가. 이름·연락처는 알 수 없으므로 placeholder.
 *       UTM·referrer·channel 만 정확하게 보관해서 어느 광고가 외부 채널 이동을
 *       만들었는지 분석 가능.
 *
 * 스키마: consultations.name/phone 는 NOT NULL → '__external_cta__' / '00000000000'
 *         placeholder 로 채움. status='외부CTA클릭' 필터로 일반 상담과 구분.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/constants'

const ALLOWED_CHANNELS = new Set(['kakao', 'form', 'instagram', 'blog'])

// 허용 출처 — SITE_URL 기반 동적 구성 (notify route 와 동일 패턴)
const ALLOWED_ORIGINS = new Set([
  SITE_URL,
  SITE_URL.replace(/^https:\/\//, 'https://www.'),
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
])

// 인메모리 디바운스 — 동일 IP 가 단시간 내 외부 CTA 폭격하는 케이스 차단
const ipDebounceMap = new Map<string, number>()
const DEBOUNCE_MS = 2000

function safeStr(v: unknown, max: number): string | null {
  return typeof v === 'string' ? v.trim().slice(0, max) || null : null
}

export async function POST(request: NextRequest) {
  try {
    // sendBeacon 으로 호출되는 케이스에는 Origin 헤더가 있을 수도 없을 수도 있음.
    // 있으면 검증, 없으면 허용 (브라우저 환경에서만 사용되는 경량 트래커이므로)
    const origin = request.headers.get('origin')
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json({ error: '허용되지 않는 출처입니다.' }, { status: 403 })
    }

    // 본문 크기 제한 (DoS 방어)
    const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
    if (contentLength > 8_192) {
      return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
    }

    let data: Record<string, unknown> = {}
    try {
      data = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    const channel = safeStr(data.channel, 32)
    if (!channel || !ALLOWED_CHANNELS.has(channel)) {
      return NextResponse.json({ error: '허용되지 않는 채널입니다.' }, { status: 400 })
    }

    // UTM 캡슐
    const utm = (data.utm && typeof data.utm === 'object') ? (data.utm as Record<string, unknown>) : {}
    const utmFields = {
      utm_source: safeStr(utm.utm_source, 200),
      utm_medium: safeStr(utm.utm_medium, 200),
      utm_campaign: safeStr(utm.utm_campaign, 200),
      utm_content: safeStr(utm.utm_content, 200),
      utm_term: safeStr(utm.utm_term, 200),
      referrer: safeStr(utm.referrer ?? data.referrer, 500),
    }

    // IP 기반 디바운스 (sendBeacon 중복 발사 방어)
    const ip = request.headers.get('x-real-ip') ?? null
    if (ip) {
      const last = ipDebounceMap.get(ip) ?? 0
      if (Date.now() - last < DEBOUNCE_MS) {
        return NextResponse.json({ ok: true, deduped: true })
      }
      ipDebounceMap.set(ip, Date.now())
      // 메모리 누수 방지 — 5분 이상 경과 항목 정리
      if (ipDebounceMap.size > 2000) {
        const cutoff = Date.now() - 5 * 60 * 1000
        for (const [k, v] of ipDebounceMap) {
          if (v < cutoff) ipDebounceMap.delete(k)
        }
      }
    }

    // consultations 스키마상 name/phone 은 NOT NULL → placeholder 로 채움
    // (스키마 변경은 별도 마이그레이션 + 대표 승인 사항)
    const motivation = '리드 의도 — 외부 채널 이동'
    const baseRecord = {
      name: '__external_cta__',
      phone: '00000000000',
      email: null,
      class_name: null,
      source: channel,
      inquiry_type: '외부CTA클릭',
      motivation,
      status: '외부CTA클릭',
      raw_payload: {
        kind: 'lite_lead',
        channel,
        ip,
        ...utmFields,
      },
    }

    try {
      // UTM 컬럼 포함 시도 → 실패 시 (마이그레이션 미실행 시) fallback
      const { error } = await getSupabaseAdmin()
        .from('consultations')
        .insert({ ...baseRecord, ...utmFields })

      if (error) {
        if (error.message?.includes('column') || error.code === '42703') {
          const { error: fallbackErr } = await getSupabaseAdmin()
            .from('consultations')
            .insert(baseRecord)
          if (fallbackErr) throw fallbackErr
        } else {
          throw error
        }
      }
    } catch (dbError) {
      console.error(
        '[lite-lead] insert 실패:',
        dbError instanceof Error ? dbError.message : String(dbError),
        { channel }
      )
      return NextResponse.json({ error: '기록 실패' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[lite-lead] route 처리 실패:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
