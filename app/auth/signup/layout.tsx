import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원가입 | KD4 액팅 스튜디오',
  robots: { index: false, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
