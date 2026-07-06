import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'LEADERBOARD — OFF THE PLASTIC',
  description: 'OFF THE PLASTIC 리더보드 — 최고 점수를 확인하세요.',
  robots: { index: false, follow: false },
  twitter: {
    card: 'summary_large_image',
    title: 'LEADERBOARD — OFF THE PLASTIC',
    description: 'OFF THE PLASTIC 리더보드 — 최고 점수를 확인하세요.',
    images: [`${SITE_URL}/og-heart.jpg`],
  },
  openGraph: {
    title: 'LEADERBOARD — OFF THE PLASTIC',
    description: 'OFF THE PLASTIC 리더보드 — 최고 점수를 확인하세요.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    type: 'website',
    url: `${SITE_URL}/game/leaderboard`,
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 — OFF THE PLASTIC 리더보드' }],
  },
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
