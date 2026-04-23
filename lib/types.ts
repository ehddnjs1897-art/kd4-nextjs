/**
 * 공유 타입 정의 — DB 스키마 기준
 */

// ─── 사용자 역할 ─────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'member' | 'actor' | 'crew_pending' | 'crew' | 'editor' | 'director' | 'admin'

// ─── 배우 관련 ───────────────────────────────────────────────────────────────

export interface Actor {
  id: string
  name: string
  name_en: string | null
  gender: string | null            // '남' | '여' | 'M' | 'F'
  age_group: string | null         // '20대' | '30대' | '40대' | '50대 이상'
  height: number | null
  weight: number | null
  skills: string[] | null
  phone?: string                   // 비로그인 시 제외
  email?: string                   // 비로그인 시 제외
  instagram: string | null
  profile_photo: string | null     // Supabase Storage URL (9:16)
  drive_photo_id: string | null    // 구글 드라이브 파일 ID (초기 임포트)
  drive_folder_id: string | null
  drive_photo_position: string | null
  source: string | null            // 'manual' | 'drive_import'
  is_public: boolean
  created_at: string
  updated_at: string
}

export type ActorPublic = Omit<Actor, 'phone' | 'email'>

export interface ActorPhoto {
  id: string
  actor_id: string
  url: string
  storage_path: string | null
  drive_file_id: string | null
  drive_photo_id: string | null
  caption: string | null
  sort_order: number
  is_profile: boolean
}

export interface ActorVideo {
  id: string
  actor_id: string
  youtube_id: string
  title: string | null
  sort_order: number
}

export interface FilmoEntry {
  id: string
  actor_id: string
  category: 'drama' | 'film' | 'cf' | 'musical' | 'theater' | 'etc'
  title: string
  role: string | null
  year: number | null
  production: string | null
  sort_order: number
}

export interface ActorDetail extends ActorPublic {
  actor_photos: ActorPhoto[]
  actor_videos: ActorVideo[]
  actor_filmography: FilmoEntry[]
}

// ─── 공통 API 응답 ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  actors: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  error: string
  status: number
}

// ─── 인사이트 ────────────────────────────────────────────────────────────────

export type InsightSourceType = 'video' | 'blog' | 'article' | 'image' | 'other'
export type InsightCategory = '연기' | '비즈니스' | '크리에이티브' | '디자인' | '기술' | '라이프' | '기타'

export interface Insight {
  id: string
  url: string
  title: string | null
  description: string | null
  image_url: string | null
  memo: string | null
  category: InsightCategory | null
  tags: string[] | null
  source_type: InsightSourceType | null
  is_favorite: boolean
  created_at: string
}

// ─── 게임 관련 (OFF THE PLASTIC) ────────────────────────────────────────────

export interface GameScore {
  id: string
  user_id: string
  score: number
  duration_ms: number
  stage: number
  items_collected: number
  created_at: string
  profiles?: { name: string | null }
}

export interface GamePrize {
  id: string
  user_id: string
  period_start: string
  period_type: 'weekly' | 'monthly'
  rank: number
  prize_type: string
  prize_description: string | null
  status: 'pending' | 'claimed' | 'delivered'
  created_at: string
}

