/**
 * Meta Pixel 이벤트 헬퍼
 * - 프로덕션 환경에서만 실행
 * - SSR 환경(window 없음)에서 안전
 */

function track(event: string, params?: Record<string, unknown>) {
  if (
    process.env.NODE_ENV !== 'production' ||
    typeof window === 'undefined' ||
    !window.fbq
  ) return
  window.fbq('track', event, params)
}

export const pixel = {
  /** 상담 폼 제출 성공 */
  lead: () =>
    track('Lead', { content_name: '상담 접수', value: 0, currency: 'KRW' }),

  /** 카카오 상담 버튼 클릭 */
  contact: () =>
    track('Contact'),

  /** 클래스 카드 상담받기 클릭 */
  viewContent: (contentName: string) =>
    track('ViewContent', { content_name: contentName, content_category: 'class' }),
}
