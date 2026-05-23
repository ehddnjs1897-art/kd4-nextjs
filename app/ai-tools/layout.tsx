import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'AI 대본 분석',
  description: 'KD4 멤버 전용 AI 대본 분석 도구 — 대사·감정·캐릭터를 자동으로 분석합니다.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/ai-tools` },
  openGraph: {
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    type: 'website',
    url: `${SITE_URL}/ai-tools`,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 — AI 대본 분석 도구' }],
  },
}

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  return children
}
