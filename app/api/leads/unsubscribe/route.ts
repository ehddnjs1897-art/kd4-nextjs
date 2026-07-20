/**
 * /api/leads/unsubscribe?id={notion_page_id} 또는 ?phone={전화번호} — 상담자 현황(잠재고객) 마케팅 문자 수신거부
 *
 * casting-alerts/unsubscribe 와 동일한 보안 패턴:
 * GET  = 확인 페이지만 표시 (쓰기 없음, 프리페치/스캔봇에 의한 오탐 차단)
 * POST = 확정 버튼 클릭 시에만 실제 처리
 *   - id 모드: 기존 상담자 현황 카드의 상태를 "🚫 이탈"로 변경(카드 삭제 아님)
 *   - phone 모드(2026-07-21 추가): 노션 카드를 미리 만들 필요 없이, 문자 링크에 전화번호만
 *     심어두면 됨. 클릭 시 해당 번호로 상담자 현황을 조회해 있으면 이탈 처리, 없으면
 *     "🚫 이탈" 상태의 신규 카드를 자동 생성 — 이후 캠페인 대조에서 자동으로 제외된다.
 */
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PHONE_RE = /^01[0-9]\d{3,4}\d{4}$/
const NOTION_DATABASE_ID = 'e4f5f376-3214-4e18-8deb-b2ab1e5dd9da'

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  return PHONE_RE.test(digits) ? digits : null
}

function htmlPage(body: string) {
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>KD4 액팅 스튜디오</title>
<style>
  body{font-family:-apple-system,'Malgun Gothic',sans-serif;background:#F5F0E8;color:#1f2430;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;}
  .card{background:#fff;border-radius:16px;padding:40px 28px;max-width:360px;box-shadow:0 2px 12px rgba(0,0,0,0.06);}
  h1{font-size:18px;color:#15488A;margin:0 0 12px;}
  p{font-size:14px;color:#5b6472;line-height:1.6;margin:0 0 20px;}
  button{background:#15488A;color:#fff;border:none;border-radius:10px;padding:13px 28px;font-size:15px;font-weight:600;cursor:pointer;width:100%;}
  button:active{transform:scale(0.97);}
</style></head>
<body><div class="card"><h1>KD4 액팅 스튜디오</h1>${body}</div></body></html>`
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')?.trim() ?? ''
  const phoneRaw = req.nextUrl.searchParams.get('phone')?.trim() ?? ''
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null

  if (!UUID_RE.test(id) && !phone) {
    return new NextResponse(htmlPage('<p>잘못된 링크입니다. 문자에 있던 링크를 다시 확인해주세요.</p>'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const action = phone ? `/api/leads/unsubscribe?phone=${phone}` : `/api/leads/unsubscribe?id=${id}`

  return new NextResponse(
    htmlPage(
      `<p>KD4 소식을 더 이상 받지 않으시겠어요?<br>아래 버튼을 누르면 수신이 해제됩니다.</p>
<form method="POST" action="${action}">
  <button type="submit">수신거부 확정</button>
</form>`
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

async function unsubscribeById(id: string, token: string) {
  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      properties: {
        '상태': { select: { name: '🚫 이탈' } },
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[leads/unsubscribe] Notion 업데이트 실패:', res.status, body.slice(0, 500))
    return false
  }
  console.warn(`[leads/unsubscribe] 수신거부 확정(id): ${id}`)
  return true
}

async function unsubscribeByPhone(phone: string, token: string) {
  // 1) 전화번호로 기존 카드 조회
  const queryRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      filter: { property: '연락처', phone_number: { equals: phone } },
      page_size: 1,
    }),
  })

  if (queryRes.ok) {
    const data = await queryRes.json().catch(() => null)
    const existingId = data?.results?.[0]?.id
    if (existingId) {
      return unsubscribeById(existingId, token)
    }
  } else {
    const body = await queryRes.text().catch(() => '')
    console.error('[leads/unsubscribe] Notion 조회 실패:', queryRes.status, body.slice(0, 500))
  }

  // 2) 없으면 "🚫 이탈" 상태로 신규 카드 생성 — 이후 캠페인 대조에서 자동 제외
  const createRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        '이름': { title: [{ type: 'text', text: { content: '(수신거부)' } }] },
        '연락처': { phone_number: phone },
        '상태': { select: { name: '🚫 이탈' } },
        '접수일': { date: { start: new Date().toISOString() } },
      },
    }),
  })
  if (!createRes.ok) {
    const body = await createRes.text().catch(() => '')
    console.error('[leads/unsubscribe] Notion 신규 카드 생성 실패:', createRes.status, body.slice(0, 500))
    return false
  }
  console.warn(`[leads/unsubscribe] 수신거부 확정(phone, 신규카드): ${phone}`)
  return true
}

export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')?.trim() ?? ''
  const phoneRaw = req.nextUrl.searchParams.get('phone')?.trim() ?? ''
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null

  if (!UUID_RE.test(id) && !phone) {
    return new NextResponse(htmlPage('<p>잘못된 요청입니다.</p>'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const token = process.env.NOTION_TOKEN?.trim()
  if (!token) {
    console.error('[leads/unsubscribe] NOTION_TOKEN 미설정')
    return new NextResponse(htmlPage('<p>처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const ok = phone ? await unsubscribeByPhone(phone, token) : await unsubscribeById(id, token)

    if (!ok) {
      return new NextResponse(htmlPage('<p>처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return new NextResponse(
      htmlPage('<p>KD4 소식 수신이 해제되었습니다.<br>더 이상 발송되지 않습니다.<br><br>다시 받고 싶으시면 010-8564-0244로 연락 주세요.</p>'),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (err) {
    console.error('[leads/unsubscribe] 예외:', err instanceof Error ? err.message : '(unknown)')
    return new NextResponse(htmlPage('<p>처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
