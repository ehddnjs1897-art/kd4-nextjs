import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '프로필 편집 — KD4',
  robots: { index: false, follow: false },
}

export default function DashboardEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
