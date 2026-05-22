import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '글 쓰기 — KD4 커뮤니티',
  robots: { index: false, follow: false },
}

export default function BoardWriteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
