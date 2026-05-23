import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PLAY — OFF THE PLASTIC',
  robots: { index: false, follow: false },
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
