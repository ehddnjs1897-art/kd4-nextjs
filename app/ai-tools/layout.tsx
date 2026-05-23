import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 대본 분석',
  description: 'KD4 멤버 전용 AI 대본 분석 툴.',
  robots: { index: false, follow: false },
}

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  return children
}
