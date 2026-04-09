/**
 * 공유 타입 정의
 */

// ─── 배우 관련 ───────────────────────────────────────────────────────────────

export interface Actor {
  id: string
  name: string
  gender: string | null
  age_group: string | null
  birth_year: number | null
  height: number | null
  weight: number | null
  agency: string | null
  profile_image_url: string | null
  bio: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  // 비로그인 시 제외되는 컬럼
  phone?: string
  email?: string
}

export interface ActorPublic extends Omit<Actor, 'phone' | 'email'> {}

export interface ActorPhoto {
  id: string
  actor_id: string
  url: string
  caption: string | null
  order: number
  created_at: string
}

export interface ActorVideo {
  id: string
  actor_id: string
  url: string
  title: string | null
  thumbnail_url: string | null
  created_at: string
}

export interface ActorFilmography {
  id: string
  actor_id: string
  title: string
  role: string | null
  year: number | null
  type: string | null // 영화, 드라마, 웹드라마 등
  created_at: string
}

export interface ActorDetail extends ActorPublic {
  actor_photos: ActorPhoto[]
  actor_videos: ActorVideo[]
  actor_filmography: ActorFilmography[]
}

// ─── 공통 API 응답 ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  error: string
  status: number
}
