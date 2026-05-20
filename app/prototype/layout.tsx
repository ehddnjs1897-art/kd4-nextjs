import type { Metadata } from 'next'

/* 프로토타입(디자인 비교용) — 검색 노출 차단 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return children
}
