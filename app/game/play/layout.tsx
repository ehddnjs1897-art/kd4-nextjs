import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'PLAY — OFF THE PLASTIC',
  description: 'OFF THE PLASTIC 게임 플레이 — 점수를 올려 리더보드에 도전하세요.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'PLAY — OFF THE PLASTIC',
    description: 'OFF THE PLASTIC 게임 플레이 — 점수를 올려 리더보드에 도전하세요.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    type: 'website',
    url: `${SITE_URL}/game/play`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 — OFF THE PLASTIC' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLAY — OFF THE PLASTIC',
    description: 'OFF THE PLASTIC 게임 플레이',
    images: [`${SITE_URL}/og-image.jpg`],
  },
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
