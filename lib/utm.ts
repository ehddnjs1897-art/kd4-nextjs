/**
 * UTM 표기 정규화 — 유입 분석 단일 기준 (2026-07-30 신설)
 *
 * 배경: 링크마다 손으로 UTM을 붙이다 보니 같은 채널이 여러 이름으로 쪼개져 기록됐다.
 * 실측(2026-07-30): consultations 22건 중 utm_source가 `ig` 14건 / `instagram` 8건으로 분리 —
 * 같은 인스타그램인데 리포트에서 두 채널로 보여 "어느 광고가 상담을 만들었나"를 셀 수 없었다.
 *
 * 해결: **서버 저장 직전에 정규화**한다. 광고 링크에 뭘 붙이든(ig/insta/IG…) DB에는 한 이름만 남는다.
 * - source = 플랫폼 (instagram / facebook / kakao / naver / google / youtube / threads)
 * - medium = 유료·자연 구분 (paid / organic / referral / email / sms)
 * 유료 여부는 medium이 책임지므로 source에서 meta·인스타를 나눌 필요가 없다.
 *
 * 짝꿍 문서: KD4-HUB/04-ops/playbooks/meta-utm-url-setup.md
 */

/** 별칭 → 정규 source. 키는 소문자·공백제거 기준으로 비교한다. */
const SOURCE_ALIASES: Record<string, string> = {
  ig: 'instagram',
  insta: 'instagram',
  instagram: 'instagram',
  instagram_bio: 'instagram',
  meta: 'instagram', // 과거 유료광고 표기 — 실제 노출은 인스타 중심. paid 여부는 medium이 구분
  fb: 'facebook',
  facebook: 'facebook',
  kakao: 'kakao',
  kakaotalk: 'kakao',
  naver: 'naver',
  naverblog: 'naver',
  blog: 'naver',
  google: 'google',
  youtube: 'youtube',
  yt: 'youtube',
  threads: 'threads',
  litt: 'linktree',
  littly: 'linktree',
  linktree: 'linktree',
}

/** 별칭 → 정규 medium */
const MEDIUM_ALIASES: Record<string, string> = {
  paid: 'paid',
  paid_boost: 'paid',
  paid_social: 'paid',
  cpc: 'paid',
  ppc: 'paid',
  ad: 'paid',
  boost: 'paid',
  ads: 'paid',
  organic: 'organic',
  social: 'organic',
  bio: 'organic',
  referral: 'referral',
  email: 'email',
  newsletter: 'email',
  sms: 'sms',
  lms: 'sms',
}

function canonicalKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

/**
 * 매핑에 없는 값은 **버리지 않고** 소문자로만 정리해 그대로 둔다.
 * 새 채널을 쓰기 시작했을 때 데이터가 사라지는 것보다, 낯선 이름이 리포트에 뜨는 편이 낫다.
 */
export function normalizeUtmSource(raw?: string | null): string | null {
  if (!raw?.trim()) return null
  const key = canonicalKey(raw)
  return SOURCE_ALIASES[key] ?? key
}

export function normalizeUtmMedium(raw?: string | null): string | null {
  if (!raw?.trim()) return null
  const key = canonicalKey(raw)
  return MEDIUM_ALIASES[key] ?? key
}

/** campaign·content는 광고마다 자유롭게 붙이므로 소문자·공백정리만 한다 (의미 훼손 금지) */
export function normalizeUtmLabel(raw?: string | null): string | null {
  if (!raw?.trim()) return null
  return canonicalKey(raw)
}
