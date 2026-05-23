import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SITE_URL as BASE } from '@/lib/constants'

// 배우 프로필 ID 캐시 (60초) — 배포마다 새로 생성되므로 짧은 TTL 불필요
export const revalidate = 86400 // 24시간

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const NOW = new Date()

  // 공개 정적 페이지 (노인덱스 페이지는 제외: /join, /actors, /board 등)
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: NOW, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/about`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/classes`, lastModified: NOW, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/meisner-technique-class`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/reel-production-class`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/sinchon-acting-academy`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/acting-coach-dongwon-kwon`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/benefits`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/benefits/seowoo-studio`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.65 },
  ]

  // 배우 프로필 페이지 (공개 배우만 — 비공개는 페이지 컴포넌트에서 404 반환)
  const { data: actors } = await supabaseAdmin
    .from('actors')
    .select('id')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const actorPages: MetadataRoute.Sitemap = (actors ?? []).map((a) => ({
    url: `${BASE}/actors/${a.id}`,
    lastModified: NOW,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...actorPages]
}
