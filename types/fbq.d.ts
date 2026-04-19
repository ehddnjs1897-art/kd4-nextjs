/**
 * 분석 스크립트 글로벌 타입 선언
 * - Meta Pixel (fbq)
 * - Google Analytics 4 (gtag, dataLayer)
 */
declare global {
  interface Window {
    fbq: (
      action: 'init' | 'track' | 'trackCustom',
      event: string,
      params?: Record<string, unknown>
    ) => void
    _fbq: unknown

    /** GA4 gtag — layout 에서 Script 로 주입 */
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
export {}
