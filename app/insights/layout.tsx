import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: '인사이트',
  description: '연기·비즈니스·크리에이티브 분야의 영상·아티클·이미지 인사이트를 큐레이션합니다.',
  robots: { index: false, follow: false },
  openGraph: {
    title: '인사이트 | KD4 액팅 스튜디오',
    description: '연기·비즈니스·크리에이티브 분야의 영상·아티클·이미지 인사이트를 큐레이션합니다.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    type: 'website',
    url: `${SITE_URL}/insights`,
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '인사이트 | KD4 액팅 스튜디오',
    description: '연기·비즈니스·크리에이티브 분야의 영상·아티클·이미지 인사이트를 큐레이션합니다.',
    images: [`${SITE_URL}/og-heart.jpg`],
  },
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
