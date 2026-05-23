import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인',
  description: 'KD4 액팅 스튜디오 로그인',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
