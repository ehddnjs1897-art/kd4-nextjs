import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Noto_Serif_KR, Oswald } from 'next/font/google'
import Script from 'next/script'
import '../styles/globals.css'
import ConditionalShell from '@/components/layout/ConditionalShell'
import { RouteAnnouncer } from '@/components/layout/RouteAnnouncer'
import JsonLd from '@/components/seo/JsonLd'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import GAPageTracker from '@/components/analytics/GAPageTracker'
import MetaPixel from '@/components/analytics/MetaPixel'
import { SITE_URL } from '@/lib/constants'

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F0F0E8' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'KD4 액팅 스튜디오 | 배우의 성장을 운영하는 신촌 마이즈너 연기학원',
    template: '%s | KD4 액팅 스튜디오',
  },
  description:
    '서울 신촌 마이즈너 테크닉 기반 연기학원. 연기 훈련부터 출연영상 포트폴리오 제작, 캐스팅 연계까지. 배우의 성장을 운영하는 KD4 액팅 스튜디오 — Actor Operating System.',
  keywords: [
    '연기학원', '마이즈너 테크닉', '신촌 연기학원', '배우 포트폴리오',
    '출연영상 제작', '캐스팅 연계', '연기 입문', '배우 훈련',
    '이바나 처벅 테크닉', '카메라 연기', '오디션 준비',
    'KD4', 'KD4 액팅 스튜디오', '서울 연기학원',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL, languages: { 'ko': SITE_URL, 'x-default': SITE_URL } },
  verification: {
    google: 'W0fUOZTRh2Bays8786YMujcbOqWkA66OiOreK_OO2rw',
    other: { 'naver-site-verification': '55356c87afb0497963a7979c98e2cdf68ac09044' },
  },
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/favicon.ico',
    apple: '/heart-logo.png',
  },
  openGraph: {
    title: 'KD4 액팅 스튜디오 | 배우의 성장을 운영하는 신촌 마이즈너 연기학원',
    description: '서울 신촌 마이즈너 테크닉 연기학원. 연기 훈련·포트폴리오 제작·캐스팅 연계. 배우의 성장을 운영하는 KD4 액팅 스튜디오',
    url: SITE_URL,
    siteName: 'KD4 액팅 스튜디오',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'KD4 액팅 스튜디오 — 배우의 성장을 운영하는 Actor Operating System',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KD4 액팅 스튜디오',
    description: '배우의 성장을 운영하는 KD4 — 마이즈너 테크닉 연기 훈련 · 포트폴리오 제작 · 캐스팅 연계.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
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
        {/* KoPubWorld 서브셋 폰트 preload — Vercel edge에서 직서빙, 64~122KB */}
        <link rel="preload" href="/fonts/KoPubWorldDotum-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/KoPubWorldBatang-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* 서드파티 도메인 preconnect — TCP+TLS를 미리 열어 스크립트 로딩 지연 감소 */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://t1.kakaocdn.net" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        {/* Supabase preconnect — 클라이언트 인증 갱신·Storage 요청 TCP 핸드셰이크 선점 */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
      </head>
      <body
        className={`${notoSansKR.variable} ${notoSerifKR.variable} ${oswald.variable}`}
      >
        <noscript>
          <p style={{ textAlign: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
            이 사이트는 JavaScript가 필요합니다. 브라우저 설정에서 JavaScript를 활성화해주세요.
          </p>
        </noscript>
        <RouteAnnouncer />
        <ConditionalShell>{children}</ConditionalShell>
        <GoogleAnalytics />
        <GAPageTracker />
        <MetaPixel />
        {/* Kakao SDK: lazyOnload — 공유 버튼 클릭 전에 불필요, 클릭 시 fallback(클립보드) 확보됨 */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          strategy="lazyOnload"
          integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  )
}
