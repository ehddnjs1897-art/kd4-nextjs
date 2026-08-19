import type { MetadataRoute } from 'next'
// 사이트맵은 공개분만 나열 — anon+RLS로 충분, service 키 사고와 격리 (2026-08-05)
import { supabasePublic } from '@/lib/supabase/public'
import { SITE_URL as BASE } from '@/lib/constants'
import { CASTING_TAG_OPTIONS } from '@/lib/actor-tags'
import { AGE_OPTIONS } from '@/lib/monologues'
import { LAST_UPDATED } from '@/lib/last-updated'

// 배우 프로필 ID 캐시 (60초) — 배포마다 새로 생성되므로 짧은 TTL 불필요
export const revalidate = 86400 // 24시간

/** 조합 필터 페이지(성별×연령대)를 사이트맵에 올릴 최소 편수 — monologues/page.tsx COMBO_MIN_COUNT와 동일 */
const COMBO_MIN_COUNT = 10

/** 데이터가 없을 때 쓰는 최후 폴백 — NOW(오늘)를 쓰면 매일 "변경됨" 거짓 신호가 된다 */
const FALLBACK_DATE = new Date(LAST_UPDATED.home)

type MonologueRow = { id: string; created_at: string | null; target: string | null; medium: string | null }
type ActorRow = { id: string; updated_at: string | null }

/** 주어진 집합의 가장 최근 타임스탬프 → lastModified (없으면 폴백) */
function latestDate(values: (string | null | undefined)[], fallback: Date): Date {
  let max = ''
  for (const v of values) {
    if (v && v > max) max = v
  }
  if (!max) return fallback
  const d = new Date(max)
  return Number.isNaN(d.getTime()) ? fallback : d
}

/** target 컬럼("여성 / 20대")의 성별 매칭 — '여성/여자', '남성/남자' 혼용이라 첫 글자로 판정 */
function matchesGender(target: string | null, gender: string): boolean {
  return (target ?? '').startsWith(gender.charAt(0))
}

/** target 컬럼의 연령대 매칭 — AGE_OPTIONS.patterns(50대+는 50대·60대 포함) 재사용 */
function matchesAge(target: string | null, ageValue: string): boolean {
  const opt = AGE_OPTIONS.find((o) => o.value === ageValue)
  if (!opt) return false
  return opt.patterns.some((p) => (target ?? '').includes(p))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 배우 프로필 페이지 (공개 배우만 — 비공개는 페이지 컴포넌트에서 404 반환)
  // lastModified: actors.updated_at 사용 — 검색엔진에 "변경된 페이지만" 명확히 신호 (NOW 일괄보다 신뢰도 ↑)
  // 빌드 내성: Supabase env가 없는 환경(예: 키가 Production 전용인 Vercel preview)에서도
  // 사이트맵 생성이 죽지 않도록 try/catch — 실패 시 정적 페이지만 반환.
  let actors: ActorRow[] = []
  try {
    const { data, error: actorsError } = await supabasePublic
      .from('actors')
      .select('id, updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
    if (actorsError) console.error('[sitemap] actors 조회 실패:', actorsError.message)
    actors = (data ?? []) as ActorRow[]
  } catch (e) {
    console.warn('[sitemap] Supabase 접근 실패 — 정적 페이지만 반환', e instanceof Error ? e.message : e)
  }

  // 독백 아카이브 (공개분만) — 상세 URL + 필터 페이지 lastmod 계산을 이 한 번의 조회로 모두 처리
  let monologues: MonologueRow[] = []
  try {
    const { data, error: monoError } = await supabasePublic
      .from('monologues')
      .select('id, created_at, updated_at, target, medium')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    if (monoError) console.error('[sitemap] monologues 조회 실패:', monoError.message)
    // monologues.updated_at은 트리거로 자동 갱신됨(2026-07-10 마이그레이션) — 수정일 우선
    monologues = ((data ?? []) as (MonologueRow & { updated_at?: string | null })[]).map((m) => ({
      id: m.id,
      // 상세 페이지 lastmod는 "수정일 우선, 없으면 생성일"
      created_at: m.updated_at ?? m.created_at,
      target: m.target,
      medium: m.medium,
    }))
  } catch (e) {
    console.warn('[sitemap] monologues 접근 실패 — 목록 페이지만 반환', e instanceof Error ? e.message : e)
  }

  const actorsLastMod = latestDate(actors.map((a) => a.updated_at), FALLBACK_DATE)
  const monologuesLastMod = latestDate(monologues.map((m) => m.created_at), FALLBACK_DATE)

  // 정적 페이지 lastModified: 실제 마지막 수정일 상수 (lib/last-updated.ts 단일 출처 —
  // 각 페이지 JSON-LD dateModified와 같은 값을 써야 모순 신호가 안 생긴다)
  // (NOW 일괄 사용 시 검색엔진에 매일 "변경됨" 거짓 신호 → 신뢰도 하락)
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                                   lastModified: new Date(LAST_UPDATED.home),    changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/about`,                        lastModified: new Date(LAST_UPDATED.about),   changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/classes`,                      lastModified: new Date(LAST_UPDATED.classes), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/meisner-technique-class`,      lastModified: new Date(LAST_UPDATED.meisner), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/reel-production-class`,        lastModified: new Date(LAST_UPDATED.reel),    changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/sinchon-acting-academy`,       lastModified: new Date(LAST_UPDATED.sinchon), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/acting-coaches`,               lastModified: new Date(LAST_UPDATED.coaches), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/actors`,                       lastModified: actorsLastMod,          changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/benefits`,                     lastModified: new Date('2026-08-12'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/benefits/mom-pt-pilates`,      lastModified: new Date('2026-08-12'), changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE}/benefits/seowoo-studio`,       lastModified: new Date('2026-06-11'), changeFrequency: 'monthly', priority: 0.65 },
    // 2026-07-10 신설 페이지 — AEO 핵심 (FAQ=AI 답변엔진 인용 타깃, reviews=신뢰 신호)
    { url: `${BASE}/faq`,                          lastModified: new Date('2026-07-10'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/reviews`,                      lastModified: new Date('2026-07-10'), changeFrequency: 'weekly',  priority: 0.7 },
    // 독백 아카이브 — 남자독백·여자독백 등 실검색 키워드 타깃 핵심 페이지 (2026-07-16 SEO 강화로 0.7→0.85)
    { url: `${BASE}/monologues`,                   lastModified: monologuesLastMod,      changeFrequency: 'daily',   priority: 0.85 },
    { url: `${BASE}/privacy`,                      lastModified: new Date('2026-07-07'), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms`,                        lastModified: new Date('2026-07-07'), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const actorPages: MetadataRoute.Sitemap = actors.map((a) => ({
    url: `${BASE}/actors/${a.id}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : actorsLastMod,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  // 독백 아카이브 상세 페이지 — lastmod = updated_at ?? created_at (위 매핑에서 이미 해결)
  const monologuePages: MetadataRoute.Sitemap = monologues.map((m) => ({
    url: `${BASE}/monologues/${m.id}`,
    lastModified: m.created_at ? new Date(m.created_at) : monologuesLastMod,
    changeFrequency: 'monthly' as const,
    priority: 0.55,
  }))

  // 캐스팅 태그별 필터 페이지 — 형사 배우·의사 배우 등 키워드 검색 유입
  // (태그별 집합의 max(updated_at)를 얻으려면 태그 컬럼까지 실어와야 해서, 배우 전체 최신 수정일로 통일)
  const tagPages: MetadataRoute.Sitemap = [...CASTING_TAG_OPTIONS].map((tag) => ({
    url: `${BASE}/actors?tag=${encodeURIComponent(tag)}`,
    lastModified: actorsLastMod,
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }))

  // 성별·연령대 필터 페이지 — "남자 배우 DB", "30대 배우 DB" 등 키워드 유입
  const genderPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/actors?gender=%EB%82%A8`, lastModified: actorsLastMod, changeFrequency: 'weekly' as const, priority: 0.68 }, // 남
    { url: `${BASE}/actors?gender=%EC%97%AC`, lastModified: actorsLastMod, changeFrequency: 'weekly' as const, priority: 0.68 }, // 여
  ]
  const AGE_GROUPS = ['20대', '30대', '40대', '50대', '60대 이상']
  const agePages: MetadataRoute.Sitemap = AGE_GROUPS.map((ag) => ({
    url: `${BASE}/actors?ageGroup=${encodeURIComponent(ag)}`,
    lastModified: actorsLastMod,
    changeFrequency: 'weekly' as const,
    priority: 0.63,
  }))

  // 독백 성별·매체 필터 페이지 — "남자독백대본"·"여자독백대본"·"영화독백"·"드라마독백" 키워드 유입
  // (self-canonical: app/monologues/page.tsx generateMetadata에서 단독 필터 시 자기 URL을 canonical로 선언)
  // lastModified는 각 집합의 최신 등록일 — 목록이 안 바뀐 필터에 "오늘 변경됨"을 보내지 않는다.
  const monologueGenderPages: MetadataRoute.Sitemap = ['남성', '여성'].map((g) => ({
    url: `${BASE}/monologues?gender=${encodeURIComponent(g)}`,
    lastModified: latestDate(
      monologues.filter((m) => matchesGender(m.target, g)).map((m) => m.created_at),
      monologuesLastMod,
    ),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))
  const monologueMediumPages: MetadataRoute.Sitemap = ['영화', 'TV드라마', '연극', '뮤지컬'].map((md) => ({
    url: `${BASE}/monologues?medium=${encodeURIComponent(md)}`,
    lastModified: latestDate(
      monologues.filter((m) => m.medium === md).map((m) => m.created_at),
      monologuesLastMod,
    ),
    changeFrequency: 'weekly' as const,
    priority: 0.62,
  }))
  // "20대독백"~"50대독백" 키워드 유입 — lib/monologues.ts AGE_OPTIONS value와 일치해야 함
  const monologueAgePages: MetadataRoute.Sitemap = AGE_OPTIONS.map((o) => ({
    url: `${BASE}/monologues?age=${encodeURIComponent(o.value)}`,
    lastModified: latestDate(
      monologues.filter((m) => matchesAge(m.target, o.value)).map((m) => m.created_at),
      monologuesLastMod,
    ),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }))

  // 성별 × 연령대 조합 페이지 — "10대 여자 독백 대사"·"30대 남자 독백" 실검색어 타깃.
  // 파라미터 순서는 gender→age 고정(generateMetadata canonical·buildHref와 동일), 10편 미만 조합은 제외(얇은 페이지).
  const monologueComboPages: MetadataRoute.Sitemap = ['남성', '여성'].flatMap((g) =>
    AGE_OPTIONS.map((o) => {
      const set = monologues.filter((m) => matchesGender(m.target, g) && matchesAge(m.target, o.value))
      return { g, ageValue: o.value, set }
    })
      .filter(({ set }) => set.length >= COMBO_MIN_COUNT)
      .map(({ g: gender, ageValue, set }) => ({
        url: `${BASE}/monologues?gender=${encodeURIComponent(gender)}&age=${encodeURIComponent(ageValue)}`,
        lastModified: latestDate(set.map((m) => m.created_at), monologuesLastMod),
        changeFrequency: 'weekly' as const,
        priority: 0.66,
      })),
  )

  return [
    ...staticPages,
    ...actorPages,
    ...monologuePages,
    ...monologueGenderPages,
    ...monologueMediumPages,
    ...monologueAgePages,
    ...monologueComboPages,
    ...tagPages,
    ...genderPages,
    ...agePages,
  ]
}
