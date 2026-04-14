import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Noto_Serif_KR, Oswald } from 'next/font/google'
import Script from 'next/script'
import '../styles/globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingCTA from '@/components/layout/FloatingCTA'
import JsonLd from '@/components/seo/JsonLd'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import MetaPixel from '@/components/analytics/MetaPixel'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-noto-serif-kr',
  display: 'swap',
})

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export const metadata: Metadata = {
  title: {
    default: 'KD4 액팅 스튜디오 | 서울 신촌 마이즈너 테크닉 연기학원',
    template: '%s | KD4 액팅 스튜디오',
  },
  description:
    '서울 신촌 마이즈너 테크닉 연기학원. 연기 훈련·포트폴리오 제작·캐스팅 연계. KD4 액팅 스튜디오',
  keywords: [
    '연기학원', '마이즈너 테크닉', '신촌 연기학원', '배우 포트폴리오',
    '출연영상 제작', '캐스팅 연계', '연기 입문', '배우 훈련',
    '이바나 처벅 테크닉', '카메라 연기', '오디션 준비',
    'KD4', 'KD4 액팅 스튜디오', '서울 연기학원',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://kd4.club' },
  verification: {
    google: 'W0fUOZTRh2Bays8786YMujcbOqWkA66OiOreK_OO2rw',
    other: { 'naver-site-verification': '55356c87afb0497963a7979c98e2cdf68ac09044' },
  },
  metadataBase: new URL('https://kd4.club'),
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'KD4 액팅 스튜디오 | 서울 신촌 마이즈너 테크닉 연기학원',
    description: '서울 신촌 마이즈너 테크닉 연기학원. 연기 훈련·포트폴리오 제작·캐스팅 연계. KD4 액팅 스튜디오',
    url: 'https://kd4.club',
    siteName: 'KD4 액팅 스튜디오',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'KD4 액팅 스튜디오 — 마이즈너 테크닉 연기 훈련',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KD4 액팅 스튜디오',
    description: '마이즈너 테크닉 기반 연기 훈련 · 포트폴리오 제작 · 캐스팅 연계.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <JsonLd />
        <GoogleAnalytics />
        <MetaPixel />
      </head>
      <body
        className={`${notoSansKR.variable} ${notoSerifKR.variable} ${oswald.variable}`}
      >
        <Navbar />
        <main style={{ paddingBottom: '88px' }}>{children}</main>
        <Footer />
        <FloatingCTA />
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          strategy="afterInteractive"
          integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  )
}
