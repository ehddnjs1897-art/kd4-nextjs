import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원 유형 선택',
  description: 'KD4 액팅 스튜디오 회원 유형 선택',
  robots: { index: false, follow: false },
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
