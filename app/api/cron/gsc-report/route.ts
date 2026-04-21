/**
 * GET /api/cron/gsc-report
 *
 * Vercel Cron이 매일 오전 8시(KST)에 호출.
 * Google Search Console API → 전날 키워드 TOP 20 → Resend 이메일 발송.
 *
 * 필요한 환경변수:
 *   CRON_SECRET                  Vercel이 호출 시 Authorization: Bearer {secret}
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL GSC 서비스 계정 이메일
 *   GOOGLE_SERVICE_ACCOUNT_KEY   서비스 계정 private key (PEM, \n 이스케이프)
 *   GSC_SITE_URL                 ex) sc-domain:kd4.club
 *   GSC_REPORT_EMAIL             리포트 수신 이메일 (기본: uikactors@gmail.com)
 *   RESEND_API_KEY               Resend API 키
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// ─── 타입 ──────────────────────────────────────────────────────────────────

interface GscRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// ─── GSC OAuth2 (서비스 계정 JWT) ─────────────────────────────────────────

async function getGscAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!
  const privateKey = rawKey.replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url')

  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const signature = sign.sign(privateKey, 'base64url')
  const jwt = `${header}.${payload}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`GSC 토큰 발급 실패: ${err}`)
  }

  const { access_token } = await tokenRes.json()
  return access_token as string
}

// ─── GSC 키워드 데이터 조회 ────────────────────────────────────────────────

async function fetchGscKeywords(accessToken: string, siteUrl: string, date: string): Promise<GscRow[]> {
  const encoded = encodeURIComponent(siteUrl)
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: date,
      endDate: date,
      dimensions: ['query'],
      rowLimit: 20,
      orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API 오류 (${res.status}): ${err}`)
  }

  const data = await res.json()
  return (data.rows as GscRow[]) ?? []
}

// ─── 날짜 유틸 ────────────────────────────────────────────────────────────

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function formatKoreanDate(iso: string): string {
  const [, m, day] = iso.split('-')
  return `${parseInt(m)}월 ${parseInt(day)}일`
}

// ─── 이메일 HTML 생성 ─────────────────────────────────────────────────────

function buildEmailHtml(rows: GscRow[], date: string, siteUrl: string): string {
  const dateLabel = formatKoreanDate(date)
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0)
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0)

  const rowsHtml = rows.length === 0
    ? `<tr><td colspan="5" style="text-align:center;padding:24px;color:#888">
        데이터 없음 — GSC에 직접 확인하세요<br/>
        <a href="https://search.google.com/search-console" style="color:#3b5bdb">search.google.com/search-console</a>
       </td></tr>`
    : rows
        .map(
          (r, i) => `
          <tr style="border-bottom:1px solid #2a2a2a;${i % 2 === 0 ? 'background:#1a1a1a' : ''}">
            <td style="padding:8px 12px;color:#c4a55a;font-weight:700;text-align:center;width:36px">${i + 1}</td>
            <td style="padding:8px 12px;color:#f0f0f0;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.keys[0]}</td>
            <td style="padding:8px 12px;color:#7ed07e;text-align:right;white-space:nowrap">${r.clicks.toLocaleString()}</td>
            <td style="padding:8px 12px;color:#7ab8ff;text-align:right;white-space:nowrap">${r.impressions.toLocaleString()}</td>
            <td style="padding:8px 12px;color:#aaa;text-align:right;white-space:nowrap">${(r.position).toFixed(1)}위</td>
          </tr>`
        )
        .join('')

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">

    <!-- 헤더 -->
    <div style="border-bottom:1px solid #2a2a2a;padding-bottom:20px;margin-bottom:24px">
      <p style="margin:0 0 6px;font-size:0.75rem;letter-spacing:0.2em;color:#c4a55a;text-transform:uppercase">KD4 ACTING STUDIO</p>
      <h1 style="margin:0;font-size:1.4rem;color:#f0f0f0">🌅 GSC 모닝리포트 <span style="color:#c4a55a">${dateLabel}</span></h1>
      <p style="margin:8px 0 0;font-size:0.8rem;color:#666">${siteUrl}</p>
    </div>

    <!-- 요약 통계 -->
    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
      <div style="flex:1;min-width:120px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px 20px">
        <p style="margin:0 0 4px;font-size:0.7rem;color:#888;text-transform:uppercase;letter-spacing:0.1em">총 클릭</p>
        <p style="margin:0;font-size:1.6rem;font-weight:700;color:#7ed07e">${totalClicks.toLocaleString()}</p>
      </div>
      <div style="flex:1;min-width:120px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px 20px">
        <p style="margin:0 0 4px;font-size:0.7rem;color:#888;text-transform:uppercase;letter-spacing:0.1em">총 노출</p>
        <p style="margin:0;font-size:1.6rem;font-weight:700;color:#7ab8ff">${totalImpressions.toLocaleString()}</p>
      </div>
      <div style="flex:1;min-width:120px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px 20px">
        <p style="margin:0 0 4px;font-size:0.7rem;color:#888;text-transform:uppercase;letter-spacing:0.1em">키워드 수</p>
        <p style="margin:0;font-size:1.6rem;font-weight:700;color:#c4a55a">${rows.length}</p>
      </div>
    </div>

    <!-- 키워드 테이블 -->
    <div style="background:#141414;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;margin-bottom:24px">
      <div style="padding:14px 16px;border-bottom:1px solid #2a2a2a">
        <h2 style="margin:0;font-size:0.9rem;color:#f0f0f0;letter-spacing:0.05em">📊 키워드 순위 TOP ${rows.length}</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.84rem">
        <thead>
          <tr style="border-bottom:1px solid #2a2a2a">
            <th style="padding:10px 12px;color:#666;font-size:0.7rem;text-align:center;width:36px">#</th>
            <th style="padding:10px 12px;color:#666;font-size:0.7rem;text-align:left">키워드</th>
            <th style="padding:10px 12px;color:#666;font-size:0.7rem;text-align:right;white-space:nowrap">클릭</th>
            <th style="padding:10px 12px;color:#666;font-size:0.7rem;text-align:right;white-space:nowrap">노출</th>
            <th style="padding:10px 12px;color:#666;font-size:0.7rem;text-align:right;white-space:nowrap">순위</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>

    <!-- 푸터 -->
    <div style="text-align:center;padding-top:16px;border-top:1px solid #1e1e1e">
      <a href="https://search.google.com/search-console" style="display:inline-block;padding:10px 20px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;color:#c4a55a;text-decoration:none;font-size:0.8rem">
        GSC 대시보드 열기 →
      </a>
      <p style="margin:12px 0 0;font-size:0.72rem;color:#444">KD4 Acting Studio · kd4.club</p>
    </div>
  </div>
</body>
</html>`
}

// ─── 이메일 발송 ──────────────────────────────────────────────────────────

async function sendReport(html: string, date: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[gsc-report] RESEND_API_KEY 미설정 — 이메일 생략')
    return
  }

  const to = process.env.GSC_REPORT_EMAIL ?? 'uikactors@gmail.com'
  const dateLabel = formatKoreanDate(date)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'KD4 리포트 <onboarding@resend.dev>',
      to,
      subject: `🌅 GSC 모닝리포트 ${dateLabel}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[gsc-report] Resend 오류:', res.status, err)
  }
}

// ─── 핸들러 ───────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const siteUrl = process.env.GSC_SITE_URL
  if (!siteUrl) {
    return NextResponse.json({ error: 'GSC_SITE_URL 환경변수 미설정' }, { status: 500 })
  }

  const date = getYesterday()

  try {
    // 환경변수 체크
    const hasCredentials =
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    let rows: GscRow[] = []

    if (hasCredentials) {
      const token = await getGscAccessToken()
      rows = await fetchGscKeywords(token, siteUrl, date)
    } else {
      console.warn('[gsc-report] 서비스 계정 환경변수 미설정 — 빈 리포트 발송')
    }

    const html = buildEmailHtml(rows, date, siteUrl)
    await sendReport(html, date)

    return NextResponse.json({
      ok: true,
      date,
      keywords: rows.length,
      totalClicks: rows.reduce((s, r) => s + r.clicks, 0),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[gsc-report] 오류:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
