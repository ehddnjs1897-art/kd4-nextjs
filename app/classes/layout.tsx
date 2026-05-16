/**
 * /classes 페이지는 'use client' 컴포넌트라 metadata를 직접 export 못 함.
 * 이 layout이 metadata 전담 — children은 그대로 패스스루.
 */
import type { Metadata } from 'next'

const PAGE_URL = 'https://kd4.club/classes'

export const metadata: Metadata = {
  title: '연기 클래스 전체 보기 — KD4 액팅 스튜디오',
  description:
    '베이직·마이즈너 정규·출연영상·심화·오디션·움직임·개인 레슨. 마이즈너 테크닉 기반 9개 클래스. 서울 신촌.',
  keywords: [
    '연기 클래스',
    '마이즈너 클래스',
    '출연영상 클래스',
    '오디션 클래스',
    '연기 입문',
    '연기학원',
    '신촌 연기학원',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '연기 클래스 전체 보기 — KD4 액팅 스튜디오',
    description:
      '베이직부터 액터스 리더까지 9개 클래스. 마이즈너 테크닉 기반 연기 훈련 · 출연영상 · 캐스팅 연계.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '연기 클래스 전체 보기 — KD4',
    description: '마이즈너 테크닉 기반 9개 클래스.',
    images: ['/og-image.jpg'],
  },
}

export default function ClassesLayout({ children }: { children: React.ReactNode }) {
  return children
}
