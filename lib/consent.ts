/**
 * 서비스 동의 버전 단일 소스.
 *
 * 동의 기록은 Supabase Auth user_metadata에 저장:
 *   consent_tos     — 이용약관 동의 버전 (예: 'v1')
 *   consent_privacy — 개인정보 수집·이용 동의 버전
 *   consent_dist    — 프로필 공개·캐스팅 관계자 제공·사진영상 이용허락 동의 버전 (배우 멤버)
 *   consent_at      — 마지막 동의 시각 (ISO)
 *
 * 약관/방침 문서를 개정해 재동의가 필요해지면 이 버전을 올린다 —
 * 기존 동의값과 불일치하는 회원에게 대시보드 배너가 다시 뜬다.
 */
export const CONSENT_VERSION = 'v1'
