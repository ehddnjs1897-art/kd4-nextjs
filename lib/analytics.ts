/**
 * 통합 분석 헬퍼 — Meta Pixel + Google Analytics 4
 *
 * 사용 원칙
 *  - 프로덕션 환경에서만 실제 이벤트 발화 (dev/SSR 안전)
 *  - Meta Pixel 표준 이벤트 + GA4 추천 이벤트 규격 동시 준수
 *  - 기존 `pixel.*` 호출은 그대로 유지 (pixel은 이 파일에서 re-export)
 *  - 퍼널 각 단계를 1개 함수로 추상화 → CTR/Lead CPA 측정 용이
 *
 * GA4 규격: https://support.google.com/analytics/answer/9267735
 * Meta 표준 이벤트: https://developers.facebook.com/docs/meta-pixel/reference
 */

/* 전역 fbq/gtag 타입은 types/fbq.d.ts 에서 선언 */

type GAParams = Record<string, unknown>

/* ── 내부 발화 함수 ──────────────────────────────────────────────── */

function isProd(): boolean {
  return (
    typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  )
}

function fbTrack(event: string, params?: GAParams) {
  if (!isProd() || !window.fbq) return
  try {
    window.fbq('track', event, params)
  } catch {
    /* 추적 실패는 UX 를 막지 않음 */
  }
}

function fbTrackCustom(event: string, params?: GAParams) {
  if (!isProd() || !window.fbq) return
  try {
    window.fbq('trackCustom', event, params)
  } catch {
    /* no-op */
  }
}

function gaTrack(event: string, params?: GAParams) {
  if (!isProd() || !window.gtag) return
  try {
    window.gtag('event', event, params)
  } catch {
    /* no-op */
  }
}

/* ── 퍼널 헬퍼 ─────────────────────────────────────────────────── */

export const analytics = {
  /** 페이지 진입 — 별도 호출 불필요 (MetaPixel/GA 컴포넌트가 자동) */
  pageView: (path?: string) => {
    fbTrack('PageView')
    gaTrack('page_view', { page_path: path })
  },

  /** 랜딩 페이지 뷰 (리타겟팅 오디언스용 ViewContent) */
  viewLanding: (pageName: string) => {
    fbTrack('ViewContent', {
      content_name: pageName,
      content_category: 'landing',
    })
    gaTrack('view_content', {
      content_type: 'landing_page',
      item_id: pageName,
    })
  },

  /** 스크롤 깊이 — GA4 표준 scroll 이벤트 */
  scrollDepth: (percent: 25 | 50 | 75 | 100) => {
    gaTrack('scroll', { percent_scrolled: percent })
    if (percent >= 75) {
      /* 75% 이상 읽은 유저는 리타겟팅 가치 높음 */
      fbTrackCustom('DeepScroll', { percent })
    }
  },

  /** CTA 버튼 클릭 (히어로/오퍼/섹션 등) */
  ctaClick: (location: string, label?: string) => {
    gaTrack('cta_click', { cta_location: location, cta_label: label })
    fbTrackCustom('CTAClick', { location, label })
  },

  /** 신청 CTA 클릭 — 버튼 클릭 인텐트를 Lead로 집계 (Meta 광고 최적화용) */
  ctaLead: (location: string, label?: string) => {
    gaTrack('cta_click', { cta_location: location, cta_label: label, cta_type: 'lead' })
    fbTrackCustom('CTAClick', { location, label })
    fbTrack('Lead', { content_name: label ?? '무료 상담 신청', content_category: location, value: 0, currency: 'KRW' })
  },

  /** 클래스 카드 조회 (ViewContent) */
  viewContent: (contentName: string) => {
    fbTrack('ViewContent', {
      content_name: contentName,
      content_category: 'class',
    })
    gaTrack('view_item', {
      item_name: contentName,
      item_category: 'class',
    })
  },

  /** 폼 첫 상호작용 — 퍼널 중간 지표 */
  formStart: (formName = 'join_form') => {
    fbTrack('InitiateCheckout', { content_name: formName })
    gaTrack('form_start', { form_name: formName })
  },

  /** 폼 제출 성공 — 핵심 전환 */
  lead: (params?: { source?: string; className?: string; value?: number }) => {
    const { source = 'unknown', className, value = 0 } = params ?? {}
    fbTrack('Lead', {
      content_name: className ?? '상담 접수',
      content_category: source,
      value,
      currency: 'KRW',
    })
    /* CompleteRegistration 도 같이 쏴서 광고 최적화 폭 확장 */
    fbTrack('CompleteRegistration', {
      content_name: className ?? '상담 접수',
      status: 'pending',
    })
    gaTrack('generate_lead', {
      lead_source: source,
      item_name: className,
      value,
      currency: 'KRW',
    })
  },

  /** 카카오/문의 채널 클릭 */
  contact: (channel: 'kakao' | 'phone' | 'form' = 'kakao') => {
    fbTrack('Contact', { content_category: channel })
    gaTrack('contact', { method: channel })
  },

  /** 커스텀 이벤트 이스케이프 해치 */
  custom: (event: string, params?: GAParams) => {
    fbTrackCustom(event, params)
    gaTrack(event, params)
  },
}

/* ── 하위 호환 ─────────────────────────────────────────────────── */

/**
 * 기존 `pixel.*` 호출을 그대로 유지하기 위한 호환 API
 * @deprecated 새 코드는 `analytics.*` 를 사용하세요
 */
export const pixel = {
  lead: () => analytics.lead({ source: 'join_form' }),
  contact: () => analytics.contact('kakao'),
  viewContent: (name: string) => analytics.viewContent(name),
}
