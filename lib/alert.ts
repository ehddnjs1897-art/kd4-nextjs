import 'server-only'
import { sendSMS } from './sms'

/**
 * 심각한 서버 오류를 대표 폰(ADMIN_PHONE_NUMBER)으로 SMS 알림.
 *
 * 2026-07-06 photo_type 업로드 장애를 멤버 제보로야 알게 된 사고 재발 방지 —
 * 핵심 경로(업로드 등) 실패와 uncaught 서버 오류(instrumentation.ts)에서 호출.
 * 인스턴스당 30분 1건 스로틀 — 오류 폭주 시 문자 폭탄 방지.
 */
let lastAlertAt = 0
const ALERT_COOLDOWN_MS = 30 * 60 * 1000

export async function notifyAdminError(context: string, detail: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return
  const to = process.env.ADMIN_PHONE_NUMBER
  if (!to) return
  const now = Date.now()
  if (now - lastAlertAt < ALERT_COOLDOWN_MS) return
  lastAlertAt = now
  await sendSMS(
    to,
    `[kd4.club 오류] ${context}\n${detail.slice(0, 120)}\n(30분 내 추가 오류 문자는 생략 — Vercel 로그 확인)`
  )
}
