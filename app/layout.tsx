import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Noto_Serif_KR, Oswald } from 'next/font/google'
import Script from 'next/script'
import '../styles/globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingCTA from '@/components/layout/FloatingCTA'

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
  title: 'KD4 액팅 스튜디오',
  description: '마이즈너 테크닉 기반 연기 훈련 · 포트폴리오 제작 · 캐스팅 연계. 현장에서 통하는 배우를 만듭니다.',
  metadataBase: new URL('https://kd4.club'),
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'KD4 액팅 스튜디오',
    description: '마이즈너 테크닉 기반 연기 훈련 · 포트폴리오 제작 · 캐스팅 연계. 현장에서 통하는 배우를 만듭니다.',
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
