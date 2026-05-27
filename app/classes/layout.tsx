/**
 * /classes 페이지는 'use client' 컴포넌트라 metadata를 직접 export 못 함.
 * 이 layout이 metadata 전담 — children은 그대로 패스스루.
 */
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb, buildCourseFromClass } from '@/lib/seo-schemas'
import { CLASSES } from '@/lib/classes'

const PAGE_URL = `${SITE_URL}/classes`

export const metadata: Metadata = {
  title: '연기 클래스 전체 보기',
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
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '연기 클래스 전체 보기 — KD4 액팅 스튜디오',
    description:
      '베이직부터 액터스 리더까지 9개 클래스. 마이즈너 테크닉 기반 연기 훈련 · 출연영상 · 캐스팅 연계.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 — 연기 클래스' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '연기 클래스 전체 보기 — KD4',
    description: '베이직부터 출연영상·오디션까지 9개 클래스. 마이즈너 테크닉 기반 소수정예 연기 훈련.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 — 연기 클래스' }],
  },
}

const classItemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: '연기 클래스 전체 목록',
  url: PAGE_URL,
  numberOfItems: CLASSES.length,
  itemListElement: CLASSES.map((cls, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: cls.nameKo,
    url: PAGE_URL,
  })),
}

export default function ClassesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageJsonLd schemas={[
        buildBreadcrumb([
          { name: '홈', url: SITE_URL },
          { name: '연기 클래스', url: PAGE_URL },
        ]),
        classItemListSchema,
        ...CLASSES.map((cls) => buildCourseFromClass(cls, { url: PAGE_URL })),
      ]} />
      {children}
    </>
  )
}
