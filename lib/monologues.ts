import 'server-only'
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

const SELECT_COLUMNS =
  'id, role, work, medium, genre, target, emotion, body, full_body, source_url, source_platform, card_image_url, grade, created_at'

/** 성별/나이대가 합쳐진 target 컬럼(예: "여성 / 20대")에서 성별만 필터링 */
export async function getMonologues(filters: MonologueFilters = {}): Promise<Monologue[]> {
  // grade 정렬(S→A→B)은 문자열 순서와 안 맞아 DB에 안 맡기고 아래에서 JS로 보정
  let query = supabaseAdmin
    .from('monologues')
    .select(SELECT_COLUMNS)
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

  const rows = (data ?? []) as Monologue[]
  // grade 정렬 보정: S → A → B
  const gradeOrder: Record<string, number> = { S: 0, A: 1, B: 2 }
  return rows.sort((a, b) => (gradeOrder[a.grade] ?? 9) - (gradeOrder[b.grade] ?? 9))
}

/** 발행된 독백 전체 개수 (필터 무관 — 부제 "○○편" 표기용) */
export async function getMonologueTotalCount(): Promise<number> {
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
