/**
 * lib/email.ts — Resend 기반 이메일 발송 유틸
 * RESEND_API_KEY 없으면 콘솔 경고만 출력 (에러 안 냄)
 */

const ADMIN_EMAIL = 'uikactors@gmail.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kd4.club'
// Resend 무료 플랜 기본 발신자 (도메인 인증 전까지)
const FROM = 'KD4 알림 <onboarding@resend.dev>'

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY 미설정 — 이메일 생략:', subject)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[email] Resend 오류:', res.status, body)
  }
}

/** KD4 크루 신청 관리자 알림 */
export async function notifyCrewRequest(name: string, email: string, userId: string) {
  const approveUrl = `${SITE_URL}/api/admin/approve-crew?uid=${userId}`
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#3b5bdb">👥 KD4 크루 신청 알림</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;width:80px">이름</td><td style="padding:6px 0"><strong>${name}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888">이메일</td><td style="padding:6px 0">${email}</td></tr>
        <tr><td style="padding:6px 0;color:#888">시각</td><td style="padding:6px 0">${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td></tr>
      </table>
      <hr style="margin:20px 0"/>
      <a href="${approveUrl}" style="display:inline-block;padding:10px 20px;background:#3b5bdb;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:8px">
        승인하기
      </a>
      <a href="${SITE_URL}/admin" style="display:inline-block;padding:10px 20px;background:#444;color:#fff;border-radius:6px;text-decoration:none;">
        관리자 패널
      </a>
    </div>
  `
  await sendEmail(ADMIN_EMAIL, `[KD4] 크루 신청 — ${name}`, html)
}
