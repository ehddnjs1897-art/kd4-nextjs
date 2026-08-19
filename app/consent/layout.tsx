import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

// /consent 는 로그인 회원 전용 동의 화면 — 검색 색인 불필요. 루트 metadata(홈 title/canonical) 상속을 끊는다.
export const metadata: Metadata = {
  title: '서비스 이용 동의',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/consent` },
}

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
