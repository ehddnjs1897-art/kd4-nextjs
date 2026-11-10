/**
 * 배우 프로필 영상 제목 — 화면 표시용 정리 (2026-11-10)
 *
 * 멤버가 올린 영상은 제목 칸에 파일 이름이 그대로 들어온다
 * (예: «남 1990년 권동원 출연영상_사극.mp4», «KakaoTalk_20260618_003411054.mp4»,
 *  전화번호가 들어간 파일명도 있음). DB 값은 건드리지 않고, 서버에서 화면으로 내보낼 때만 다듬는다.
 *  - 확장자·주소(URL)·전화번호 제거, 밑줄 → 띄어쓰기
 *  - 제목에 배우 이름이 들어 있으면(프로필 파일명 관례) 이름·성별·출생연도·나이 토막 제거
 *  - 기기가 붙인 이름(카톡·밴드·제목 없음·일련번호 등)이면 빈 값 → «출연영상 N»으로 대체
 */

const EXT_RE = /\.+(mp4|mov|m4v|webm|avi|mkv|wmv)$/i
const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g
const MACHINE_RE = /^(band[_ ]video|kakaotalk|copy[_ ]|_?talkv|img[_ ]|vid[_ ]|mov[_ ]|video[_ ]|screen|inbound|제목\s*없음|무제|untitled|내\s*영화|my\s*movie|새\s*프로젝트)/i
const GENERIC_RE = /^(출연|연기|프로필|지원)?\s*(영상|동영상)$/
const PERSON_TOKEN_RE = /(^|\s)(남자|여자|남|여|배우|프로필)(?=\s|$)/g

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 표시용으로 다듬은 제목. 뜻 있는 내용이 남지 않으면 '' */
export function cleanVideoTitle(raw: string | null | undefined, actorName: string): string {
  if (!raw) return ''
  let t = raw.normalize('NFC').replace(/https?:\/\/\S+/g, ' ').replace(PHONE_RE, ' ').trim()
  const wasFile = EXT_RE.test(t)
  t = t.replace(EXT_RE, '').trim()
  if (MACHINE_RE.test(t)) return ''
  // 한글 없이 긴 숫자·일련번호(UUID·해시)뿐인 이름 = 기기가 붙인 파일명
  if (!/[가-힣]/.test(t) && (/\d{5,}/.test(t) || /[0-9a-f]{8}-[0-9a-f]{4}/i.test(t))) return ''

  t = t.replace(/_+/g, ' ')
  if (wasFile) t = t.replace(/[.:]+/g, ' ')

  const nameKey = actorName.normalize('NFC').replace(/\s/g, '')
  if (nameKey.length >= 2 && t.replace(/\s/g, '').includes(nameKey)) {
    const nameRe = new RegExp(nameKey.split('').map(escapeRe).join('\\s*'), 'g')
    t = t
      .replace(nameRe, ' ')
      .replace(/\[([^\]]*)\]/g, (_m, inner: string) => (/[가-힣]{2,}/.test(inner) ? ` ${inner} ` : ' '))
      .replace(/\((\d*)\)/g, ' ')
      .replace(/\d{1,2}\s*월(?=\s|$)/g, ' ')
      .replace(/\d{2,4}\s*년\s*생?/g, ' ')
      .replace(/\d{2}\s*(대|세|살)(?=\s|\)|$)/g, ' ')
      .replace(PERSON_TOKEN_RE, ' ')
      .replace(/(^|\s|\()-?(\d{1,2}|\d{4})(?=\s|\)|$)/g, '$1')
      .replace(PERSON_TOKEN_RE, ' ')
      .replace(/\(\s*\)/g, ' ')
  }

  t = t.replace(/\s+/g, ' ').replace(/^[\s\-·|,]+|[\s\-·|,]+$/g, '')
  // 통째로 괄호에 싸인 제목은 괄호를 벗긴다 — «(출연영상)» → «출연영상»
  const wrapped = t.match(/^\(([^()]*)\)$/)
  if (wrapped) t = wrapped[1].trim()
  // 한글 두 글자 / 영문 세 글자 이상의 낱말이 없으면 뜻 있는 제목으로 보지 않는다
  if (!/[가-힣]{2,}|[A-Za-z]{3,}/.test(t)) return ''
  return t.replace(/([가-힣])(\d+)$/, '$1 $2')
}

type TitledVideo = { title?: string | null; video_type?: string | null; sort_order?: number | null }

/**
 * 화면으로 내보낼 영상 목록 — 제목을 표시용으로 바꿔 돌려준다(원본 파일명은 클라이언트로 내려가지 않음).
 *  - 출연영상(reel): 비었거나 «출연영상»뿐이면 «출연영상 N»(한 편이면 번호 없이). N은 화면에 놓이는 순서.
 *  - 그 밖(독백 등): 다듬은 제목, 없으면 null
 */
export function withDisplayTitles<T extends TitledVideo>(videos: T[] | null | undefined, actorName: string): T[] {
  const sorted = [...(videos ?? [])].sort(
    (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)
  )
  const reelCount = sorted.filter((v) => !v.video_type || v.video_type === 'reel').length
  let reelIndex = 0
  return sorted.map((v) => {
    const cleaned = cleanVideoTitle(v.title, actorName)
    if (!v.video_type || v.video_type === 'reel') {
      reelIndex += 1
      const title = !cleaned || GENERIC_RE.test(cleaned)
        ? (reelCount > 1 ? `출연영상 ${reelIndex}` : '출연영상')
        : cleaned
      return { ...v, title }
    }
    return { ...v, title: cleaned || null }
  })
}
