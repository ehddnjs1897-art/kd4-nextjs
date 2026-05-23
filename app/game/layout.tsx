import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OFF THE PLASTIC',
  description: '가면을 벗어라. 무대 위로, 더 높이. KD4 액팅 스튜디오 3D 아케이드 게임.',
  robots: { index: false, follow: false },
  openGraph: {
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
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
