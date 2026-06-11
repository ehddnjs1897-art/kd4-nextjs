import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/dashboard/',
          '/insights/',
          // /benefits/replay: noindex meta로만 제외 (Disallow+noindex 동시 사용 시 크롤 차단으로 noindex 미인식 → 외부링크 경유 인덱싱 가능)
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
