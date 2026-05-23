import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LEADERBOARD — OFF THE PLASTIC',
  description: 'OFF THE PLASTIC 리더보드 — 최고 점수를 확인하세요.',
  robots: { index: false, follow: false },
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
