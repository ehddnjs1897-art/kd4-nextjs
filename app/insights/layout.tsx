import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: '인사이트',
  description: '연기·비즈니스·크리에이티브 분야의 영상·아티클·이미지 인사이트를 큐레이션합니다.',
  robots: { index: false, follow: false },
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
