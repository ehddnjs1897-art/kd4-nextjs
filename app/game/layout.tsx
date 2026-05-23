import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'OFF THE PLASTIC',
  description: '가면을 벗어라. 무대 위로, 더 높이. KD4 액팅 스튜디오 3D 아케이드 게임.',
  robots: { index: false, follow: false },
  openGraph: {
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    type: 'website',
    url: `${SITE_URL}/game`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 — 스포트라이트 러시 게임' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OFF THE PLASTIC | KD4 액팅 스튜디오',
    description: '가면을 벗어라. 무대 위로, 더 높이. KD4 액팅 스튜디오 3D 아케이드 게임.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#020202',
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {children}
    </div>
  )
}
