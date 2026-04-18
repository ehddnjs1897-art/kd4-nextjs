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

// ============================================
// 운영시스템 타입
// ============================================

export interface ClassRow {
  id: string
  slug: string
  step: string
  category: 'step1' | 'step2' | 'step3' | 'extra' | null
  name_ko: string
  name_en: string | null
  quote: string | null
  subtitle: string | null
  note: string | null
  bullets: string[]
  schedule_label: string | null
  duration_label: string | null
  capacity_label: string | null
  capacity: number | null
  course_label: string | null
  price: number
  original_price: number | null
  promo_label: string | null
  remaining_seats: number | null
  is_highlight: boolean
  is_new_member_open: boolean
  is_hobby: boolean
  is_active: boolean
  sort_order: number
  instructor_id: string | null
  instructor_label: string | null
  settlement_rate: number
  created_at: string
  updated_at: string
}

export interface ClassSchedule {
  id: string
  class_id: string
  session_no: number | null
  title: string | null
  starts_at: string
  ends_at: string
  recurrence_rule: string | null
  recurrence_parent_id: string | null
  location: string
  instructor_id: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  note: string | null
  created_at: string
  updated_at: string
}

export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'refunded'
export type EnrollmentPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export interface Enrollment {
  id: string
  application_id: string | null
  class_id: string
  user_id: string | null
  enrollee_name: string
  enrollee_phone: string | null
  enrollee_email: string | null
  started_on: string
  ends_on: string | null
  price_at_enroll: number
  discount_amount: number
  status: EnrollmentStatus
  payment_status: EnrollmentPaymentStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused' | 'makeup'

export interface AttendanceRecord {
  id: string
  schedule_id: string
  enrollment_id: string
  class_id: string | null
  user_id: string | null
  status: AttendanceStatus
  makeup_for_schedule_id: string | null
  checked_at: string
  checked_by: string | null
  note: string | null
}

export type SettlementStatus = 'draft' | 'approved' | 'paid' | 'disputed'

export interface Settlement {
  id: string
  instructor_id: string
  class_id: string | null
  period_start: string
  period_end: string
  gross_revenue: number
  settlement_rate: number
  adjustments: number
  payout_amount: number
  session_count: number
  attendance_count: number
  calculation_snapshot: Record<string, unknown> | null
  status: SettlementStatus
  paid_at: string | null
  paid_by: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export type PaymentMethod = 'card' | 'transfer' | 'kakaopay' | 'tosspay' | 'naverpay' | 'cash' | 'other'
export type PaymentType = 'payment' | 'installment' | 'refund' | 'partial_refund'
export type PaymentTxStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface Payment {
  id: string
  enrollment_id: string | null
  user_id: string | null
  class_id: string | null
  amount: number
  method: PaymentMethod | null
  provider: string | null
  provider_tx_id: string | null
  receipt_url: string | null
  type: PaymentType
  status: PaymentTxStatus
  paid_at: string | null
  refunded_at: string | null
  refund_reason: string | null
  settlement_id: string | null
  payer_name: string | null
  payer_phone: string | null
  memo: string | null
  created_at: string
  updated_at: string
}
