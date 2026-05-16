import type { MetadataRoute } from 'next'

const BASE = 'https://kd4.club'
const NOW = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/about`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/classes`,
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE}/meisner-technique-class`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE}/reel-production-class`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE}/sinchon-acting-academy`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/acting-coach-dongwon-kwon`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE}/reviews`,
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${BASE}/actor-reel-portfolio`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE}/actor-training-for-minor-role-actors`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/benefits`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/actors`,
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE}/board`,
      lastModified: NOW,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    // /join 은 noindex 페이지이므로 sitemap 제외
  ]
}
