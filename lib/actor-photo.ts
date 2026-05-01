/**
 * 배우 사진 URL 생성 헬퍼
 *
 * 우선순위:
 *   1. profile_photo  (수동 업로드 직링크 — 가장 신뢰)
 *   2. storage_photo_path  (Supabase Storage — 빠르고 안정)
 *   3. drive_photo_id  (Google Drive 폴백 — 마이그레이션 전 데이터)
 *   4. /placeholder-actor.svg
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const STORAGE_BUCKET = 'actor-photos'

export type ActorPhotoSource = {
  drive_photo_id?: string | null
  storage_photo_path?: string | null
  profile_photo?: string | null
}

export type PhotoSize = 'small' | 'large'

export function getActorPhotoUrl(
  actor: ActorPhotoSource,
  size: PhotoSize = 'large',
): string {
  if (actor.profile_photo) return actor.profile_photo

  if (actor.storage_photo_path && SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${actor.storage_photo_path}`
  }

  if (actor.drive_photo_id) {
    const sz = size === 'large' ? 'w900' : 'w600'
    return `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=${sz}`
  }

  return '/placeholder-actor.svg'
}
