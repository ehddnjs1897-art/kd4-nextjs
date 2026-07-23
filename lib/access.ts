/**
 * 배우 DB 열람 권한 — 중앙 정의 (한 곳에서 관리해 누락/구멍 방지)
 *
 * 정책 (2026-05-22 확정):
 *   - 배우 목록 + 프로필(사진·영상·필모) 열람: 배우 회원 / 크루 / 디렉터(승인) / 관리자 / 편집자
 *   - 연락처 + 사진/프로필 다운로드: 디렉터(승인) / 관리자 만
 *   - 비로그인 / 일반회원 / 디렉터(승인대기) → 아무것도 못 봄
 *
 * 정책 업데이트 (2026-06-09):
 *   - ACTOR_DB_PUBLIC_PROFILE = true 시 공개 배우(is_public)의 프로필 본문은 비로그인도 열람 가능
 *   - 연락처·다운로드는 여전히 canViewActorContact(디렉터/관리자)만
 *   - 롤백: ACTOR_DB_PUBLIC_PROFILE = false 한 줄로 즉시 현행 복귀 (킬스위치)
 *
 * 정책 업데이트 (2026-07-23 대표 지시 — 배우 DB 전체 공개):
 *   - 출연영상도 비로그인 열람 가능 (상세페이지 videoLocked={false} — 잠금 해제)
 *   - GET /api/actors, GET /api/actors/[id] 비로그인 호출 허용 (공개 배우만, PII 제외)
 *   - 연락처(phone/email)·프로필 다운로드는 변함없이 디렉터/관리자 전용
 */
import type { UserRole } from '@/lib/types'

/** 부분공개 정책: 공개 배우(is_public)의 프로필 본문은 비로그인도 열람 가능.
 *  연락처·다운로드는 여전히 canViewActorContact(디렉터/관리자)만.
 *  false 로 변경 시 즉시 비로그인 통짜 잠금으로 복귀 (킬스위치). */
export const ACTOR_DB_PUBLIC_PROFILE = true

/** 장르(캐스팅) 태그 표시 스위치 — 2026-06-24 대표 지시로 일단 숨김(나중에 정비).
 *  casting_tags 데이터는 보존하고 화면 배지만 가린다(카드·상세·숏리스트·연관배우).
 *  true 로 되돌리면 즉시 복구. (장르 필터 기능은 별개로 유지) */
export const SHOW_CASTING_TAGS = false

/** 배우 목록·프로필을 열람할 수 있는 역할 */
export const ACTOR_DB_VIEW_ROLES: UserRole[] = [
  'actor', 'crew', 'editor', 'director', 'admin',
]

/** 연락처·다운로드까지 열람할 수 있는 역할 */
export const ACTOR_CONTACT_ROLES: UserRole[] = ['director', 'admin']

/** 배우 목록·프로필 열람 가능 여부 */
export function canViewActorDb(role: UserRole | null | undefined): boolean {
  return !!role && (ACTOR_DB_VIEW_ROLES as string[]).includes(role)
}

/** 연락처·다운로드 열람 가능 여부 (승인 디렉터/관리자) */
export function canViewActorContact(role: UserRole | null | undefined): boolean {
  return !!role && (ACTOR_CONTACT_ROLES as string[]).includes(role)
}
