import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SITE_URL as BASE } from '@/lib/constants'
import { CASTING_TAG_OPTIONS } from '@/lib/actor-tags'

// 배우 프로필 ID 캐시 (60초) — 배포마다 새로 생성되므로 짧은 TTL 불필요
export const revalidate = 86400 // 24시간

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const NOW = new Date()

  // 정적 페이지 lastModified: 실제 마지막 수정일 상수
  // (NOW 일괄 사용 시 검색엔진에 매일 "변경됨" 거짓 신호 → 신뢰도 하락)
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                                   lastModified: new Date('2026-06-11'), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/about`,                        lastModified: new Date('2026-06-11'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/classes`,                      lastModified: new Date('2026-06-01'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/meisner-technique-class`,      lastModified: new Date('2026-06-11'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/reel-production-class`,        lastModified: new Date('2026-06-11'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/sinchon-acting-academy`,       lastModified: new Date('2026-06-11'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/acting-coach-dongwon-kwon`,    lastModified: new Date('2026-06-11'), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/actors`,                       lastModified: NOW,                   changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/benefits`,                     lastModified: new Date('2026-06-11'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/benefits/seowoo-studio`,       lastModified: new Date('2026-05-20'), changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE}/board`,                        lastModified: NOW,                   changeFrequency: 'daily',   priority: 0.6 },
    // /benefits/replay 는 robots:noindex + robots.txt Disallow → 사이트맵 제외
  ]

  // 배우 프로필 페이지 (공개 배우만 — 비공개는 페이지 컴포넌트에서 404 반환)
  // lastModified: actors.updated_at 사용 — 검색엔진에 "변경된 페이지만" 명확히 신호 (NOW 일괄보다 신뢰도 ↑)
  // 빌드 내성: Supabase env가 없는 환경(예: 키가 Production 전용인 Vercel preview)에서도
  // 사이트맵 생성이 죽지 않도록 try/catch — 실패 시 정적 페이지만 반환.
  let actorPages: MetadataRoute.Sitemap = []
  try {
    const { data: actors, error: actorsError } = await supabaseAdmin
      .from('actors')
      .select('id, updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
    if (actorsError) console.error('[sitemap] actors 조회 실패:', actorsError.message)

    actorPages = (actors ?? []).map((a) => ({
      url: `${BASE}/actors/${a.id}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : NOW,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))
  } catch (e) {
    console.warn('[sitemap] Supabase 접근 실패 — 정적 페이지만 반환', e instanceof Error ? e.message : e)
  }

  // 캐스팅 태그별 필터 페이지 — 형사 배우·의사 배우 등 키워드 검색 유입
  const tagPages: MetadataRoute.Sitemap = [...CASTING_TAG_OPTIONS].map((tag) => ({
    url: `${BASE}/actors?tag=${encodeURIComponent(tag)}`,
    lastModified: NOW,
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }))

  // 성별·연령대 필터 페이지 — "남자 배우 DB", "30대 배우 DB" 등 키워드 유입
  const genderPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/actors?gender=%EB%82%A8`, lastModified: NOW, changeFrequency: 'weekly' as const, priority: 0.68 }, // 남
    { url: `${BASE}/actors?gender=%EC%97%AC`, lastModified: NOW, changeFrequency: 'weekly' as const, priority: 0.68 }, // 여
  ]
  const AGE_GROUPS = ['20대', '30대', '40대', '50대 이상']
  const agePages: MetadataRoute.Sitemap = AGE_GROUPS.map((ag) => ({
    url: `${BASE}/actors?ageGroup=${encodeURIComponent(ag)}`,
    lastModified: NOW,
    changeFrequency: 'weekly' as const,
    priority: 0.63,
  }))

  return [...staticPages, ...actorPages, ...tagPages, ...genderPages, ...agePages]
}
