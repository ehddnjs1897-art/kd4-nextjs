import 'server-only'

/**
 * 수강 이력 확인 — 배우 DB 공개 게이트 (2026-09-17 대표 지시 «배우 DB는 수강 이후에 등록»).
 *
 * 정본은 노션 「🎓 KD4 수강 현황」. 전화번호가 그 DB 어느 행에든(상태 무관 — 수강중·예정·종료 모두 멤버)
 * 있으면 수강 이력 있음으로 본다. 이름은 쓰지 않는다(동명이인·사칭 방지) — 전화번호 전체 일치만.
 *
 * 반환: true = 수강 이력 확인 / false = 없음 / null = 확인 실패(노션 장애·토큰 없음).
 * 호출부는 null 을 «미확인»으로 취급해 비공개 보관 + 관리자 알림으로 처리한다(안전한 쪽).
 */
const NOTION_DS = 'cf2db178-c407-48d1-ae9e-96a45b5e8a23' // 🎓 KD4 수강 현황 (lib/tossplace.ts 와 동일)
const NOTION_VER = '2025-09-03'

export async function hasEnrollmentHistory(phone: string | null | undefined): Promise<boolean | null> {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length < 10) return false
  const token = process.env.NOTION_TOKEN?.trim()
  if (!token) {
    console.error('[enrollment-verify] NOTION_TOKEN 미설정 — 수강 확인 불가')
    return null
  }
  try {
    // 노션 연락처는 "010-1234-5678" 형식 — 뒷 4자리로 좁힌 뒤 숫자 전체를 코드에서 대조
    const res = await fetch(`https://api.notion.com/v1/data_sources/${NOTION_DS}/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: { property: '연락처', phone_number: { contains: digits.slice(-4) } }, page_size: 100 }),
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) {
      console.error('[enrollment-verify] 노션 조회 실패:', res.status)
      return null
    }
    const json = (await res.json()) as { results?: { properties?: Record<string, { phone_number?: string | null }> }[] }
    return (json.results ?? []).some(
      (r) => (r.properties?.['연락처']?.phone_number ?? '').replace(/\D/g, '') === digits,
    )
  } catch (e) {
    console.error('[enrollment-verify] 예외:', e instanceof Error ? e.message : String(e))
    return null
  }
}
