import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'AI 대본 분석',
  description: 'KD4 멤버 전용 AI 대본 분석 툴.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/ai-tools` },
}

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  return children
}
