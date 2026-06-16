/**
 * /shortlist 는 'use client' (localStorage 즐겨찾기 기반 개인 숏리스트)라 metadata 직접 export 불가.
 * 이 layout이 metadata 전담 — 개인화 페이지라 검색엔진 noindex.
 */
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: '내 캐스팅 숏리스트',
  description: '관심 배우로 담아둔 캐스팅 숏리스트입니다. 마음에 드는 배우를 모아 한눈에 비교하세요.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/shortlist` },
}

export default function ShortlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
