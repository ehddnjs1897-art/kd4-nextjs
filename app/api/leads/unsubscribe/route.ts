/**
 * /api/leads/unsubscribe?id={notion_page_id} — 상담자 현황(잠재고객) 마케팅 문자 수신거부
 *
 * casting-alerts/unsubscribe 와 동일한 보안 패턴:
 * GET  = 확인 페이지만 표시 (쓰기 없음, 프리페치/스캔봇에 의한 오탐 차단)
 * POST = 확정 버튼 클릭 시에만 실제 처리 — Notion 상담자 현황 카드의 상태를
 *        "🚫 이탈"로 변경(카드 삭제 아님 — 별도 상태로 이동배치).
 */
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  if (!UUID_RE.test(id)) {
    return new NextResponse(htmlPage('<p>잘못된 링크입니다. 문자에 있던 링크를 다시 확인해주세요.</p>'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return new NextResponse(
    htmlPage(
      `<p>KD4 소식을 더 이상 받지 않으시겠어요?<br>아래 버튼을 누르면 수신이 해제됩니다.</p>
<form method="POST" action="/api/leads/unsubscribe?id=${id}">
  <button type="submit">수신거부 확정</button>
</form>`
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')?.trim() ?? ''

  if (!UUID_RE.test(id)) {
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
      return new NextResponse(htmlPage('<p>처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    console.warn(`[leads/unsubscribe] 수신거부 확정: ${id}`)

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
