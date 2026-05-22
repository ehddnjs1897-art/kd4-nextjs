/**
 * 배우 DB 열람 권한 — 중앙 정의 (한 곳에서 관리해 누락/구멍 방지)
 *
 * 정책 (2026-05-22 확정):
 *   - 배우 목록 + 프로필(사진·영상·필모) 열람: 배우 회원 / 크루 / 디렉터(승인) / 관리자 / 편집자
 *   - 연락처 + 사진/프로필 다운로드: 디렉터(승인) / 관리자 만
 *   - 비로그인 / 일반회원 / 디렉터(승인대기) → 아무것도 못 봄
 */
import type { UserRole } from '@/lib/types'

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
