import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PLAY — OFF THE PLASTIC',
  description: 'OFF THE PLASTIC 게임 플레이 — 점수를 올려 리더보드에 도전하세요.',
  robots: { index: false, follow: false },
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
