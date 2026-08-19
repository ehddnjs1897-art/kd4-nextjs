import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
// 공개 게시분만 읽는 모듈이므로 anon+RLS 클라이언트 사용 — service 키 사고와 격리 (2026-08-05)
import { supabasePublic } from '@/lib/supabase/public'

export interface Monologue {
  id: string
  role: string
  work: string
  medium: string
  genre: string
  target: string
  emotion: string
  body: string
  full_body: string | null
  source_url: string | null
  source_platform: string
  card_image_url: string | null
  grade: 'S' | 'A' | 'B'
  created_at: string
  /** 상세 SELECT에만 포함(목록 payload 유지) — Article dateModified용 */
  updated_at?: string | null
}

export interface MonologueFilters {
  gender?: string   // '남성' | '여성'
  genre?: string
  medium?: string
  age?: string      // AGE_OPTIONS의 value ('10대' | '20대' | ... | '50대이상')
}

/** 목록 카드가 실제로 렌더링하는 필드만 — 상세페이지 전용인 body/full_body/source_* 제외.
 *  emotion은 카드에 표시하진 않지만 검색 대상(2026-07-22 대표 지시: 감정 키워드 검색) —
 *  짧은 문자열(예: "슬픔 → 절망")이라 payload 영향 미미(604건 기준 ~12KB). */
export type MonologueListItem = Pick<
  Monologue,
  'id' | 'role' | 'work' | 'medium' | 'genre' | 'target' | 'emotion' | 'card_image_url' | 'grade'
>

const LIST_COLUMNS = 'id, role, work, medium, genre, target, emotion, card_image_url, grade'
const SELECT_COLUMNS =
  'id, role, work, medium, genre, target, emotion, body, full_body, source_url, source_platform, card_image_url, grade, created_at, updated_at'

/**
 * 목록 페이지 전용 — 상세 전용 필드(body/full_body 등, 편당 최대 수백~수천자)는 안 가져온다.
 * 2026-07-14 발견: 목록이 필터 조합마다 364건 전체를 body+full_body까지 통째로 실어와
 * TTFB 1.8초+/응답 1MB로 느렸음(실측). 카드가 안 쓰는 필드라 제외해도 화면엔 영향 없음.
 * 성별/나이대가 합쳐진 target 컬럼(예: "여성 / 20대")에서 성별만 필터링.
 */
export async function getMonologues(filters: MonologueFilters = {}): Promise<MonologueListItem[]> {
  // grade 정렬(S→A→B)은 문자열 순서와 안 맞아 DB에 안 맡기고 아래에서 JS로 보정
  let query = supabasePublic
    .from('monologues')
    .select(LIST_COLUMNS)
    .eq('is_published', true)
    .order('sort_weight', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.gender) {
    // target 표기 변형 흡수: 다수는 '여성 / 20대'지만 '여자 20대' 같은 비표준 표기도 섞여 있어
    // 접두 ilike 하나만 쓰면 그 편들이 인덱스 페이지에서 통째로 빠진다(2026-08-19 실측 29편).
    const altGender = filters.gender === '여성' ? '여자' : filters.gender === '남성' ? '남자' : null
    query = altGender
      ? query.or(`target.ilike.${filters.gender}%,target.ilike.${altGender}%`)
      : query.ilike('target', `${filters.gender}%`)
  }
  if (filters.genre) query = query.eq('genre', filters.genre)
  if (filters.medium) query = query.eq('medium', filters.medium)
  if (filters.age) {
    // target은 "성별 / 연령대"(예: "남성 / 50대"). 연령대 부분을 부분일치로 필터.
    // 50대+는 "50대"와 "60대 이상"을 함께 포함한다.
    const opt = AGE_OPTIONS.find((o) => o.value === filters.age)
    if (opt) query = query.or(opt.patterns.map((p) => `target.ilike.%${p}%`).join(','))
  }

  const { data, error } = await query
  if (error) {
    console.error('[monologues] 목록 조회 실패:', error.message)
    return []
  }

  const rows = (data ?? []) as MonologueListItem[]
  // grade 정렬 보정: S → A → B
  const gradeOrder: Record<string, number> = { S: 0, A: 1, B: 2 }
  return rows.sort((a, b) => (gradeOrder[a.grade] ?? 9) - (gradeOrder[b.grade] ?? 9))
}

async function fetchMonologueTotalCount(): Promise<number> {
  const { count, error } = await supabasePublic
    .from('monologues')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)

  if (error) {
    console.error('[monologues] 전체 개수 조회 실패:', error.message)
    return 0
  }
  return count ?? 0
}

/**
 * 발행된 독백 전체 개수 (필터 무관 — 부제 "○○편" 표기용).
 * 5분 단위 프로세스 간 캐시(unstable_cache) + 요청 내 중복 호출 dedupe(react cache) 이중 적용 —
 * getMonologuesCached와 동일한 이유(아래 주석 참조).
 */
export const getMonologueTotalCount = cache(
  (): Promise<number> =>
    unstable_cache(fetchMonologueTotalCount, ['monologues-total-count-v1'], {
      revalidate: 300,
      tags: ['monologues'],
    })()
)

/**
 * 필터 조합별 5분 캐시(unstable_cache) — /monologues는 searchParams를 읽어 Next.js가
 * 라우트 자체를 항상 dynamic 렌더링하므로 페이지 최상단 `export const revalidate`는
 * 이 데이터 조회에 아무 효과가 없다(2026-07-14 실측: 반복 요청에도 TTFB 1.2~1.5초로
 * 안 줄어듦 — /actors가 쓰는 unstable_cache 패턴으로 데이터 자체를 캐싱해야 함).
 * 바깥쪽 react cache()는 generateMetadata+페이지 컴포넌트가 같은 요청에서 두 번 호출해도
 * 1번만 실행되게(인자 동일성 dedupe) — 요청 내 중복 호출까지 막아준다.
 */
export const getMonologuesCached = cache(
  (gender?: string, genre?: string, medium?: string, age?: string): Promise<MonologueListItem[]> =>
    unstable_cache(
      () => getMonologues({ gender, genre, medium, age }),
      // v2: emotion 컬럼 추가(2026-07-22) — 캐시된 구형 행(emotion 없음)과 섞이지 않게 키 승격
      ['monologues-list-v2', gender ?? '', genre ?? '', medium ?? '', age ?? ''],
      { revalidate: 300, tags: ['monologues'] }
    )()
)

export async function getMonologueById(id: string): Promise<Monologue | null> {
  const { data, error } = await supabasePublic
    .from('monologues')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()

  if (error) {
    console.error('[monologues] 상세 조회 실패:', error.message)
    return null
  }
  return data as Monologue | null
}

/**
 * 상세페이지 하단 "같은 작품의 다른 독백" — 추가 DB 쿼리 0.
 * 이미 5분 캐시된 전량 목록(getMonologuesCached)에서 골라 쓴다.
 * 1) 같은 작품(work) 최대 12편 → 2) 한 편도 없으면 같은 장르+같은 성별 6편 폴백.
 */
export async function getRelatedMonologues(
  m: Pick<Monologue, 'id' | 'work' | 'genre' | 'target'>
): Promise<MonologueListItem[]> {
  const all = await getMonologuesCached()

  const sameWork = all.filter((x) => x.work === m.work && x.id !== m.id).slice(0, 12)
  if (sameWork.length > 0) return sameWork

  const gender = normalizeTarget(m.target).gender
  return all
    .filter(
      (x) =>
        x.id !== m.id &&
        x.genre === m.genre &&
        (!gender || normalizeTarget(x.target).gender === gender)
    )
    .slice(0, 6)
}

export interface NormalizedTarget {
  gender?: '여성' | '남성'
  age?: string
  /** 표시용 라벨 — 다수 표기인 "여성 / 20대" 형태(연령 없으면 "여성") */
  label: string
}

/**
 * target 컬럼 표기 정규화.
 * 실제 DB에는 "여성 / 20대"(다수) 외에 "여자 20대", "여성 40대", "남성 / 청년", "아동" 등이 섞여 있다.
 */
export function normalizeTarget(t: string | null | undefined): NormalizedTarget {
  const raw = (t ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim()
  if (!raw) return { label: '' }

  const head = raw.match(/^(여성|여자|남성|남자)/)
  if (!head) return { label: raw }

  const gender: '여성' | '남성' = head[1].startsWith('여') ? '여성' : '남성'
  const age = raw
    .slice(head[1].length)
    .replace(/^[\s/·,]+/, '')
    .trim()

  return {
    gender,
    ...(age ? { age } : {}),
    label: age ? `${gender} / ${age}` : gender,
  }
}

/** 크롤 원문 앞뒤에 붙는 블로그 안내문(예: "… 독백 대사 를 준비했어요 : )", "… 보러 가보실까요?") */
const CRAWL_NOTE_HEAD = [
  /준비했(?:어요|습니다)\s*(?::\s*\)|:\)|\^\^|~+)?\s*/g,
  /(?:보러\s*)?가보실까요\s*[?？]\s*/g,
]
const CRAWL_NOTE_TAIL =
  /(?:그럼|그러면)?\s*[^.!?？\n]{0,60}(?:독백(?:\s*대사)?\s*를?\s*준비했(?:어요|습니다)\s*(?::\s*\)|:\)|\^\^|~+)?|(?:보러\s*)?가보실까요\s*[?？])\s*$/

/**
 * 메타 title/description에 쓸 본문 앞부분 정리.
 * 제로폭 문자·크롤 안내문·머리 지문·화자 라벨을 걷어내고 실제 대사 첫 줄만 남긴다(영향 ~70편).
 */
export function cleanBodyLead(body: string | null | undefined): string {
  let s = (body ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim()
  if (!s) return ''

  // 1) 꼬리 안내문 먼저 — 뒤에 붙은 안내문을 앞머리 안내문으로 오인해 본문을 통째로 날리는 걸 막는다
  s = s.replace(CRAWL_NOTE_TAIL, '').trim()

  // 2) 앞머리 안내문 — 앞 300자 안의 마지막 안내문 종료 지점까지 잘라낸다(뒤에 남는 게 없으면 원문 유지)
  const head = s.slice(0, 300)
  let cut = 0
  for (const re of CRAWL_NOTE_HEAD) {
    re.lastIndex = 0
    let hit: RegExpExecArray | null
    while ((hit = re.exec(head)) !== null) cut = Math.max(cut, hit.index + hit[0].length)
  }
  if (cut > 0 && s.slice(cut).trim().length >= 8) s = s.slice(cut).trim()

  // 3) 머리 지문 `(…)`과 화자 라벨 `이름 : ` — 순서가 뒤바뀐 편도 있어 안 줄어들 때까지 반복
  for (let i = 0; i < 4; i += 1) {
    const before = s
    s = s.replace(/^(?:\([^)]*\)\s*)+/, '')
    s = s.replace(/^[가-힣A-Za-z ]{1,12}\s*[:：\-–]\s+/, '')
    s = s.replace(/^["'“”‘’]+\s*/, '')
    if (s === before) break
  }

  return s.replace(/\s+/g, ' ').trim()
}

export const GENRE_OPTIONS = [
  '드라마', '멜로', '코미디', '스릴러', '미스터리', '느와르', '공포', '액션',
  '판타지', '사극', '가족', '휴먼', '법정', '수사물', '로맨틱코미디', '청춘', 'SF', '기타',
]

export const MEDIUM_OPTIONS = ['영화', 'TV드라마', '연극', '뮤지컬', '웹드라마', '광고']

/**
 * 연령대 필터 옵션.
 * value = URL 파라미터(특수문자 회피 위해 '50대+' 대신 '50대이상' 사용, label만 '50대+' 노출)
 * patterns = target 컬럼("성별 / 연령대")에 부분일치시킬 문자열 목록
 */
export const AGE_OPTIONS: { value: string; label: string; patterns: string[] }[] = [
  { value: '10대', label: '10대', patterns: ['10대'] },
  { value: '20대', label: '20대', patterns: ['20대'] },
  { value: '30대', label: '30대', patterns: ['30대'] },
  { value: '40대', label: '40대', patterns: ['40대'] },
  { value: '50대이상', label: '50대+', patterns: ['50대', '60대'] },
]
