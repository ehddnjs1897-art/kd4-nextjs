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
}

const SELECT_COLUMNS =
  'id, role, work, medium, genre, target, emotion, body, full_body, source_url, source_platform, card_image_url, grade, created_at'

/** 성별/나이대가 합쳐진 target 컬럼(예: "여성 / 20대")에서 성별만 필터링 */
export async function getMonologues(filters: MonologueFilters = {}): Promise<Monologue[]> {
  let query = supabaseAdmin
    .from('monologues')
    .select(SELECT_COLUMNS)
    .eq('is_published', true)
    .order('grade', { ascending: true }) // S가 A보다 먼저 오도록 (문자열 정렬상 S < A는 아니므로 아래 정렬 보정)
    .order('sort_weight', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.gender) query = query.ilike('target', `${filters.gender}%`)
  if (filters.genre) query = query.eq('genre', filters.genre)
  if (filters.medium) query = query.eq('medium', filters.medium)

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
