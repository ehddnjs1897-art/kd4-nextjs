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
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()

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
export function shouldOptimize(actor: ActorPhotoSource): boolean {
  // 2026-07-01: Hobby 이미지 최적화 한도(402) 소진으로 전면 false 처리했었음.
  // 2026-08-19: Vercel Pro 결제(대표)로 한도 해소 → 복구. Vercel이 리사이즈·WebP 변환 후
  // 엣지에 캐시(배포해도 유지)하므로 Supabase 전송량이 원본 1회분으로 줄어든다.
  // 리사이즈는 비율 보존 — 크롭 변환 금지 룰(8/19)과 무관 (표시는 기존 CSS 그대로).
  // Drive 사진만 예외(외부 리다이렉트·약한 캐시 헤더): 원본 직접 로드 유지.
  if (actor.profile_photo || actor.storage_photo_path) return true
  return false
}

/**
 * 배우 목록 카드용 썸네일 URL — Supabase Storage 이미지 변환(render/image) 사용.
 * 원본 1280×1920 JPG(80~240KB) 대신 480×720 WebP(~13~40KB)로 모바일 전송량 80%↓ (2026-08-12 실측).
 * - Vercel 이미지 최적화기는 거치지 않으므로 402 한도 문제 없음.
 * - Storage 공개 URL이 아닌 경우(외부 URL·빈 값)는 원본 그대로 반환.
 * - height 미지정 시 480×1920으로 비율이 깨지므로 width+height+resize=cover 필수.
 */
export function getActorCardThumbUrl(actor: ActorPhotoSource): string {
  const raw = getActorPhotoUrl(actor)
  if (!raw) return ''
  const marker = '/storage/v1/object/public/'
  if (!raw.includes(marker)) return raw
  return raw.replace(marker, '/storage/v1/render/image/public/') + '?width=480&height=720&resize=cover&quality=75&format=webp'
}
