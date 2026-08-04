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

/** referrer 호스트 → 정규 source. 검색엔진은 organic, 소셜·기타는 referral
 *  (유료 유입은 UTM이 붙어 이 경로를 타지 않는다) */
const REFERRER_SOURCES: [RegExp, string, string][] = [
  [/(^|\.)naver\.com$/, 'naver', 'organic'],
  [/(^|\.)google\.[a-z.]+$/, 'google', 'organic'],
  [/(^|\.)daum\.net$/, 'daum', 'organic'],
  [/(^|\.)bing\.com$/, 'bing', 'organic'],
  [/(^|\.)instagram\.com$/, 'instagram', 'referral'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube', 'referral'],
  [/(^|\.)facebook\.com$/, 'facebook', 'referral'],
  [/(^|\.)kakao\.com$/, 'kakao', 'referral'],
]

/**
 * UTM 없는 유입의 source/medium을 referrer에서 추정한다 (2026-08-04 신설).
 * 배경: 검색으로 /monologues 등에 착지한 상담이 전부 '직접 방문'으로 뭉개져
 * "독백 아카이브가 상담을 만드나"를 셀 수 없었다. 내부 이동·referrer 없음은 null.
 */
export function inferOrganicUtm(referrer?: string | null): { utm_source: string; utm_medium: string } | null {
  if (!referrer?.trim()) return null
  let host = ''
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return null
  }
  if (!host || host === 'kd4.club' || host.endsWith('.kd4.club')) return null
  for (const [re, source, medium] of REFERRER_SOURCES) {
    if (re.test(host)) return { utm_source: source, utm_medium: medium }
  }
  // 모르는 외부 호스트도 버리지 않는다 — 낯선 이름이 리포트에 뜨는 편이 낫다 (위 normalize 철학과 동일)
  return { utm_source: host.replace(/^www\./, ''), utm_medium: 'referral' }
}
