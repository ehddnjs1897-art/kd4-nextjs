import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원가입',
  description: 'KD4 액팅 스튜디오 회원가입',
  robots: { index: false, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
