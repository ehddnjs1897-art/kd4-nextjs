import 'server-only'

/**
 * lib/email.ts — Resend 기반 이메일 발송 유틸
 * RESEND_API_KEY 없으면 콘솔 경고만 출력 (에러 안 냄)
 */

import { SITE_URL } from '@/lib/constants'

const ADMIN_EMAIL = 'uikactors@gmail.com'
// Resend 무료 플랜 기본 발신자 (도메인 인증 전까지)
const FROM = 'KD4 알림 <onboarding@resend.dev>'

/** HTML 특수문자 이스케이프 — 이메일 본문 내 XSS/인젝션 방어 */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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
    throw new Error(`[email] Resend ${res.status}: ${body}`)
  }
}

/** KD4 크루 신청 관리자 알림 */
export async function notifyCrewRequest(name: string, email: string, userId: string) {
  const approveUrl = `${SITE_URL}/api/admin/approve-crew?uid=${userId}`
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#3b5bdb">👥 KD4 크루 신청 알림</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;width:80px">이름</td><td style="padding:6px 0"><strong>${esc(name)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888">이메일</td><td style="padding:6px 0">${esc(email)}</td></tr>
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
  try {
    await sendEmail(ADMIN_EMAIL, `[KD4] 크루 신청 — ${name}`, html)
  } catch (err) {
    console.error('[notifyCrewRequest] 이메일 발송 실패:', err instanceof Error ? err.message : err)
  }
}

/** KD4 디렉터 권한 신청 관리자 알림 (승인 시 배우 연락처·다운로드 열람 가능) */
export async function notifyDirectorRequest(name: string, email: string, userId: string) {
  const approveUrl = `${SITE_URL}/api/admin/approve-crew?uid=${userId}`
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#15488a">🎥 KD4 디렉터 권한 신청</h2>
      <p style="color:#555;font-size:14px">승인하면 이 디렉터가 배우들의 <strong>연락처 + 사진/프로필 다운로드</strong>를 열람할 수 있습니다.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;width:80px">이름</td><td style="padding:6px 0"><strong>${esc(name)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888">이메일</td><td style="padding:6px 0">${esc(email)}</td></tr>
        <tr><td style="padding:6px 0;color:#888">시각</td><td style="padding:6px 0">${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td></tr>
      </table>
      <hr style="margin:20px 0"/>
      <a href="${approveUrl}" style="display:inline-block;padding:10px 20px;background:#15488a;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:8px">
        디렉터 승인하기
      </a>
      <a href="${SITE_URL}/admin" style="display:inline-block;padding:10px 20px;background:#444;color:#fff;border-radius:6px;text-decoration:none;">
        관리자 패널
      </a>
    </div>
  `
  try {
    await sendEmail(ADMIN_EMAIL, `[KD4] 디렉터 권한 신청 — ${name}`, html)
  } catch (err) {
    console.error('[notifyDirectorRequest] 이메일 발송 실패:', err instanceof Error ? err.message : err)
  }
}
