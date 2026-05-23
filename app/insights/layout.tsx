import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: '인사이트 | KD4 액팅 스튜디오',
  description: '연기·비즈니스·크리에이티브 분야의 영상·아티클·이미지 인사이트를 큐레이션합니다.',
  alternates: { canonical: `${SITE_URL}/insights` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/insights`,
    title: '인사이트 | KD4 액팅 스튜디오',
    description: '연기·비즈니스·크리에이티브 분야의 영상·아티클·이미지 인사이트를 큐레이션합니다.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '인사이트 | KD4 액팅 스튜디오',
    description: '연기·비즈니스·크리에이티브 분야의 영상·아티클·이미지 인사이트를 큐레이션합니다.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 인사이트' }],
  },
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
