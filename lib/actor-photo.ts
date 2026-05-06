/**
 * Actor 사진 URL 헬퍼
 *
 * 우선순위:
 *  1. Supabase Storage (storage_photo_path) — edge cache, 안정
 *  2. Google Drive (drive_photo_id) — 임포트 직후 임시 폴백
 *  3. 플레이스홀더 SVG
 *
 * 마이그레이션 진행 후 storage_photo_path가 채워진 actor부터 자동으로 Storage 사용.
 */

export interface ActorPhotoSource {
  storage_photo_path?: string | null
  drive_photo_id?: string | null
}

const STORAGE_BUCKET = 'actor-photos'

export function getActorPhotoUrl(actor: ActorPhotoSource): string {
  // 1순위: Storage
  if (actor.storage_photo_path) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (base) {
      return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${actor.storage_photo_path}`
    }
  }

  // 2순위: Drive 썸네일
  if (actor.drive_photo_id) {
    return `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w600`
  }

  // 3순위: 플레이스홀더
  return '/placeholder-actor.svg'
}

/**
 * next/image 최적화 사용 여부.
 * Storage는 이미 최적화됨 → next/image 캐시 OK.
 * Drive는 unoptimized 권장 (외부 도메인 + 캐시 헤더 약함).
 */
export function shouldOptimize(actor: ActorPhotoSource): boolean {
  return !!actor.storage_photo_path
}
