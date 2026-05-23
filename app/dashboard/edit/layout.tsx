import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: 'KD4 멤버 프로필 편집 — 배우 프로필·갤러리·필모그래피 관리',
  robots: { index: false, follow: false },
}

export default function DashboardEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
