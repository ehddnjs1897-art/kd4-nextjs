/**
 * Actor 사진 URL 헬퍼
 *
 * 우선순위 (배우 목록 카드 — 비로그인 노출):
 *  1. profile_photo (수동 업로드 URL) — PII 없음, 안전
 *  2. Supabase Storage (storage_photo_path) — edge cache, 안정
 *  3. 플레이스홀더 SVG  ← drive_photo_id는 이력서 이미지(PII 포함)이므로 목록 카드에서 차단
 *
 * 배우 상세 페이지(로그인 권한자)에서는 drive_photo_id 포함 전체 사용 가능.
 * 마이그레이션 진행 후 storage_photo_path가 채워진 actor부터 자동으로 Storage 사용.
 *
 * R297 (2026-06-09): drive_photo_id 기반 이력서 이미지를 비로그인 목록에서 차단.
 *   정은후 카드에서 전화번호·이메일 노출된 PII 설계 위반 사고 수정.
 */

export interface ActorPhotoSource {
  profile_photo?: string | null
  storage_photo_path?: string | null
  drive_photo_id?: string | null
}

const STORAGE_BUCKET = 'actor-photos'
// 모듈 스코프에 호이스팅 — 배우 51+명 렌더 시 env read 중복 방지
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

/**
 * 배우 목록 카드용 사진 URL (비로그인 노출 안전).
 * drive_photo_id(이력서 이미지) 차단 — PII(전화번호·이메일) 포함 가능성 있음.
 */
export function getActorPhotoUrl(actor: ActorPhotoSource): string {
  // 1순위: profile_photo (수동 업로드 — PII 없음)
  if (actor.profile_photo) return actor.profile_photo

  // 2순위: Storage
  if (actor.storage_photo_path && SUPABASE_URL) {
    // 경로 순회 공격 방지
    if (actor.storage_photo_path.split('/').some((seg: string) => seg === '..' || seg === '.')) {
      return ''
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${actor.storage_photo_path}`
  }

  // drive_photo_id는 이력서 이미지 — 비로그인 목록에서 차단 (PII 보호)
  // 배우 상세 페이지에서는 profilePhotoUrl() 함수가 Drive 폴백 처리

  // 3순위: 빈 문자열 → ActorCardImage가 초성 이니셜 폴백 표시 (다크 placeholder-actor.svg 대신)
  return ''
}

/**
 * next/image 최적화 사용 여부.
 * Storage·profile_photo는 이미 최적화됨 → next/image 캐시 OK.
 * Drive는 unoptimized 권장 (외부 도메인 + 캐시 헤더 약함).
 */
export function shouldOptimize(_actor: ActorPhotoSource): boolean {
  // Vercel 이미지 최적화 한도(402)가 소진돼 새로 올린 사진(PNG·JPG·용량 무관)이
  // 최적화기에서 전부 거부됨 → 카드·현재사진이 깨짐. 사용자 업로드 사진은 최적화기를
  // 거치지 않고 Supabase CDN 원본을 직접 로드한다 (2026-07-01). 캐시된 옛 사진은 영향 없음.
  return false
}
