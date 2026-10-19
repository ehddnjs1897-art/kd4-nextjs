/**
 * 광고 전용 랜딩(/ad/[cls]) 주소 키 ↔ 클래스 이름 (lib/classes.ts nameKo).
 * 메타 포스터 광고 1개 = 키 1개. 포스터 이미지는 public/ads/poster-{key}.jpg
 * (원본 KD4-HUB/05-content/marketing/광고_포스터4종_2026-10/).
 */
export const AD_CLASSES = {
  basic: '베이직 클래스',
  meisner: '마이즈너 테크닉 정규 클래스',
  reel: '출연영상 클래스',
  audition: '오디션 테크닉 클래스',
  private: '개인 레슨',
} as const

export type AdKey = keyof typeof AD_CLASSES

export const AD_KEYS = Object.keys(AD_CLASSES) as AdKey[]

export function isAdKey(key: string): key is AdKey {
  return key in AD_CLASSES
}
