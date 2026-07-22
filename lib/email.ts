import 'server-only'

/**
 * lib/email.ts — Resend 기반 이메일 발송 유틸
 * RESEND_API_KEY 없으면 콘솔 경고만 출력 (에러 안 냄)
 */

import { SITE_URL } from '@/lib/constants'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'uikactors@gmail.com'
// 2026-07-23 kd4.club 도메인 Resend 인증 완료 → 자체 도메인 발신으로 전환
// (기존 onboarding@resend.dev는 계정주 본인에게만 발송 가능한 임시 발신자였음)
const FROM = 'KD4 액팅 스튜디오 <noreply@kd4.club>'

/** 이메일 제목 내 SMTP 헤더 인젝션 방어 — \r\n 제거 (RFC 5321) */
function safeSubject(s: string): string {
  return s.replace(/[\r\n]/g, ' ').trim()
}

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
    signal: AbortSignal.timeout(10_000),
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
    await sendEmail(ADMIN_EMAIL, `[KD4] 크루 신청 — ${safeSubject(name)}`, html)
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
    await sendEmail(ADMIN_EMAIL, `[KD4] 디렉터 권한 신청 — ${safeSubject(name)}`, html)
  } catch (err) {
    console.error('[notifyDirectorRequest] 이메일 발송 실패:', err instanceof Error ? err.message : err)
  }
}

/* ── 멤버·신청자 대상 메일 (2026-07-23 대표 지시: 웹사이트 메일 발송 전부 연동) ──
 * KD4 브랜드 톤 공통 레이아웃 — 웜그레이 배경 + 네이비 포인트.
 * 실패해도 throw 하지 않음: 메일은 부가 채널(SMS·DB가 본선)이라 본 기능을 막지 않는다. */

function kd4Layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F0F0E8;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;padding:16px 0 20px;">
      <div style="font-size:22px;font-weight:800;letter-spacing:0.18em;color:#15488A;">KD4</div>
      <div style="font-size:10px;letter-spacing:0.32em;color:#6B6660;margin-top:2px;">ACTING STUDIO</div>
    </div>
    <div style="background:#ffffff;border:1px solid #D2D2C8;border-radius:8px;padding:28px 24px;">
      <h1 style="font-size:17px;color:#0F3364;margin:0 0 16px;">${title}</h1>
      <div style="font-size:14px;line-height:1.8;color:#333;">${bodyHtml}</div>
    </div>
    <p style="text-align:center;font-size:11px;color:#6B6660;line-height:1.7;margin-top:20px;">
      KD4 액팅 스튜디오 · 서울 신촌<br>
      문의 010-8564-0244 · <a href="https://kd4.club" style="color:#15488A;">kd4.club</a>
    </p>
  </div>
</body></html>`
}

/** 상담 신청자 본인에게 접수 확인 메일 — 사전상담 안내 SMS의 이메일판 */
export async function sendConsultationReceivedEmail(name: string, email: string) {
  const n = esc(name)
  const html = kd4Layout(
    `${n}님, 상담 신청이 접수되었습니다`,
    `<p>안녕하세요, KD4 액팅 스튜디오입니다.<br>
     신청해 주셔서 감사합니다. 사전상담을 위해 <strong>통화 가능한 시간을 2~3개</strong> 문자로 남겨주시면 맞춰 연락드리겠습니다.</p>
     <p>상담 전 카카오 채널로 프로필과 출연영상을 보내주시면 더 깊은 상담이 가능합니다. (없을 시 생략 가능)</p>
     <p style="margin:22px 0;">
       <a href="https://pf.kakao.com/_ximxdqn" style="display:inline-block;background:#15488A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:700;font-size:14px;">카카오 채널 바로가기</a>
     </p>
     <p style="font-size:13px;color:#5A5550;">
       · 웹사이트: <a href="https://kd4.club" style="color:#15488A;">kd4.club</a><br>
       · 캐스팅 포트폴리오: <a href="https://www.youtube.com/playlist?list=PLMbZlnkLfP7iaE41p_g9dzGKp5eU9VZk2" style="color:#15488A;">유튜브 재생목록</a><br>
       · 위치·시설 안내: <a href="https://kd4.club/sinchon-acting-academy" style="color:#15488A;">신촌 스튜디오</a>
     </p>`
  )
  try {
    await sendEmail(email, safeSubject(`[KD4 액팅 스튜디오] ${name}님, 상담 신청이 접수되었습니다`), html)
  } catch (err) {
    console.error('[sendConsultationReceivedEmail] 실패:', err instanceof Error ? err.message : err)
  }
}

/** 배우 프로필 접수 완료 메일 (멤버 본인) */
export async function sendProfileIntakeDoneEmail(name: string, email: string) {
  const n = esc(name)
  const html = kd4Layout(
    `${n}님, 배우 프로필이 등록되었습니다`,
    `<p>보내주신 프로필 자료가 KD4 배우 DB에 정상 등록되었습니다.<br>
     마이페이지에서 언제든 사진·영상·필모그래피를 직접 수정하실 수 있어요.</p>
     <p style="margin:22px 0;">
       <a href="https://kd4.club/dashboard" style="display:inline-block;background:#15488A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:700;font-size:14px;">내 프로필 관리하기</a>
     </p>
     <p style="font-size:13px;color:#5A5550;">프로필이 충실할수록 캐스팅 연결 확률이 높아집니다. 한줄소개·출생연도·가로 사진을 꼭 채워주세요.</p>`
  )
  try {
    await sendEmail(email, safeSubject(`[KD4 액팅 스튜디오] ${name}님, 배우 프로필이 등록되었습니다`), html)
  } catch (err) {
    console.error('[sendProfileIntakeDoneEmail] 실패:', err instanceof Error ? err.message : err)
  }
}
