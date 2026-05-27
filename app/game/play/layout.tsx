import type { Metadata, Viewport } from 'next'
import { SITE_URL } from '@/lib/constants'

// iOS Safari 핀치-투-줌이 게임 캔버스 상호작용을 방해하므로 게임 플레이 전용으로 최대 배율 고정
// WCAG 1.4.4: 게임은 zoom 제한 예외 항목 (단, 이 레이아웃만 적용 — 전체 사이트 미적용)
export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
}

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
