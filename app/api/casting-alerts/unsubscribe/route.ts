/**
 * /api/casting-alerts/unsubscribe?id={actor.id} — 오디션 정보 SMS 수신거부
 *
 * GET  = 확인 페이지만 표시 (DB 변경 없음)
 * POST = 실제 수신거부 처리 (확인 버튼 클릭 시에만)
 *
 * 2026-07-09 보안 수정 — 기존엔 GET 1회로 즉시 optout이었음:
 *  ① 문자앱·보안필터·메신저 미리보기가 링크를 미리 열어보기만 해도(프리페치)
 *     본인 의사와 무관하게 수신거부 처리되는 오탐 위험
 *  ② actor.id는 공개 프로필 URL과 동일한 값이라 제3자가 GET 한 번으로
 *     남을 강제 수신거부시킬 수 있는 문제
 *  → GET은 읽기 전용 확인 페이지로, 쓰기는 폼 제출(POST)로만. 사전 스캔봇은
 *    폼 제출까지 따라가지 않으므로 ①이 차단되고 ②의 문턱도 올라간다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

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

  // 확인 페이지만 — DB 쓰기 없음. 버튼을 눌러야 POST로 실제 처리.
  return new NextResponse(
    htmlPage(
      `<p>오디션 정보 문자를 더 이상 받지 않으시겠어요?<br>아래 버튼을 누르면 수신이 해제됩니다.</p>
<form method="POST" action="/api/casting-alerts/unsubscribe?id=${id}">
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

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('actors')
      .update({ casting_alert_optout: true })
      .eq('id', id)
      .select('name')
      .maybeSingle()

    if (error) {
      console.error('[casting-alerts/unsubscribe] update 실패:', error.message)
      return new NextResponse(htmlPage('<p>처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // 이탈 신호 참고용 로그 — 알림 완전 끄기는 관심 저하의 약한 신호일 수 있음 (단독 판단 금지)
    if (data?.name) console.warn(`[casting-alerts/unsubscribe] 수신거부 확정: ${data.name} (${id})`)

    return new NextResponse(
      htmlPage('<p>오디션 정보 문자 수신이 해제되었습니다.<br>더 이상 발송되지 않습니다.<br><br>다시 받고 싶으시면 010-8564-0244로 연락 주세요.</p>'),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (err) {
    console.error('[casting-alerts/unsubscribe] 예외:', err instanceof Error ? err.message : '(unknown)')
    return new NextResponse(htmlPage('<p>처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
