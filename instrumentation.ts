/**
 * Next.js instrumentation — 서버에서 잡히지 않은 오류를 대표 폰으로 SMS 알림.
 * (라우트가 직접 catch해서 500을 반환하는 경우는 여기 안 옴 — 핵심 라우트는
 *  lib/alert.ts notifyAdminError를 개별 호출. 예: /api/upload 사진 저장 실패)
 */
export function register() {
  // 초기화 훅 — 현재는 사용 안 함 (onRequestError만 사용)
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    const { notifyAdminError } = await import('@/lib/alert')
    const msg = err instanceof Error ? err.message : String(err)
    await notifyAdminError(`서버오류 ${request.method} ${request.path}`, msg)
  } catch (e) {
    console.error('[instrumentation] 오류 알림 발송 실패:', e instanceof Error ? e.message : e)
  }
}
