import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
}

export interface MonologueFilters {
  gender?: string   // '남성' | '여성'
  genre?: string
  medium?: string
  age?: string      // AGE_OPTIONS의 value ('10대' | '20대' | ... | '50대이상')
}

/** 목록 카드가 실제로 렌더링하는 필드만 — 상세페이지 전용인 body/full_body/source_* 제외 */
export type MonologueListItem = Pick<
  Monologue,
  'id' | 'role' | 'work' | 'medium' | 'genre' | 'target' | 'card_image_url' | 'grade'
>

const LIST_COLUMNS = 'id, role, work, medium, genre, target, card_image_url, grade'
const SELECT_COLUMNS =
  'id, role, work, medium, genre, target, emotion, body, full_body, source_url, source_platform, card_image_url, grade, created_at'

/**
 * 목록 페이지 전용 — 상세 전용 필드(body/full_body 등, 편당 최대 수백~수천자)는 안 가져온다.
 * 2026-07-14 발견: 목록이 필터 조합마다 364건 전체를 body+full_body까지 통째로 실어와
 * TTFB 1.8초+/응답 1MB로 느렸음(실측). 카드가 안 쓰는 필드라 제외해도 화면엔 영향 없음.
 * 성별/나이대가 합쳐진 target 컬럼(예: "여성 / 20대")에서 성별만 필터링.
 */
export async function getMonologues(filters: MonologueFilters = {}): Promise<MonologueListItem[]> {
  // grade 정렬(S→A→B)은 문자열 순서와 안 맞아 DB에 안 맡기고 아래에서 JS로 보정
  let query = supabaseAdmin
    .from('monologues')
    .select(LIST_COLUMNS)
    .eq('is_published', true)
    .order('sort_weight', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.gender) query = query.ilike('target', `${filters.gender}%`)
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
  const { count, error } = await supabaseAdmin
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
      ['monologues-list-v1', gender ?? '', genre ?? '', medium ?? '', age ?? ''],
      { revalidate: 300, tags: ['monologues'] }
    )()
)

export async function getMonologueById(id: string): Promise<Monologue | null> {
  const { data, error } = await supabaseAdmin
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
