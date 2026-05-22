declare global {
  interface Window {
    fbq: (
      action: 'init' | 'track' | 'trackCustom',
      event: string,
      params?: Record<string, unknown>,
      /** Meta 이벤트 중복제거용 — 클라이언트 픽셀과 서버 CAPI에 같은 eventID 전달 시 Meta가 자동 dedup */
      options?: { eventID?: string }
    ) => void
    _fbq: unknown
    gtag?: (...args: unknown[]) => void
  }
}
export {}
