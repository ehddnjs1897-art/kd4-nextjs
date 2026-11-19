import type { Metadata, Viewport } from 'next'
import { Oswald } from 'next/font/google'
import Script from 'next/script'
import '../styles/globals.css'
import '../styles/kopub-ext.css' // KoPub 보충 글꼴(기본 서브셋에 없는 글자) — 자동 생성, scripts/build-kopub-ext-fonts.py
import ConditionalShell from '@/components/layout/ConditionalShell'
import { RouteAnnouncer } from '@/components/layout/RouteAnnouncer'
import JsonLd from '@/components/seo/JsonLd'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import GAPageTracker from '@/components/analytics/GAPageTracker'
import FirstTouchTracker from '@/components/analytics/FirstTouchTracker'
import MetaPixel from '@/components/analytics/MetaPixel'
import { SITE_URL } from '@/lib/constants'

// Noto Sans KR · Noto Serif KR (next/font) 은 뺐다 — 2026-11-19 첫 화면 속도(대표 «2.5초 고»).
// 두 글꼴은 KoPub(+보충 kopub-ext)에 없는 글자 대비용 예비였는데, 홈·/join·/classes·/about·마이즈너·게시판에서 실제로 한 번도
// 내려받지 않았다(/actors 영어 조각 1개뿐). 그런데 글꼴 목록(@font-face 약 1,000줄, 53KB)이 첫 화면을 막고 있었다.
// 측정(휴대폰·느린 통신): /join 첫 큰 글자 2.73초 → 2.30초, 첫 표시 2.5초 → 1.4초. 글꼴 이름은 styles/globals.css :root 에 그대로 둔다.

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-oswald',
  // 2026-11-19 첫 화면 속도(대표 «2.5초 고»): KoPub이 먼저라 이 글꼴은 화면에 거의 안 쓰인다 → 미리 받지 않음(필요할 때만 받음)
  preload: false,
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
    default: '신촌 연기학원 KD4 액팅 스튜디오 — 마이즈너·출연영상',
    template: '%s | KD4 액팅 스튜디오',
  },
  description:
    '서울 신촌 마이즈너 테크닉 기반 연기학원. 연기 훈련부터 출연영상 포트폴리오 제작, 캐스팅 연계까지. 배우의 성장을 운영하는 KD4 액팅 스튜디오 — Actor Operating System.',
  keywords: [
    '연기학원', '마이즈너 테크닉', '신촌 연기학원', '배우 포트폴리오',
    '출연영상 제작', '캐스팅 연계', '연기 입문', '배우 훈련',
    '카메라 연기', '오디션 준비',
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
        url: `${SITE_URL}/og-heart.jpg`,
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
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 글꼴 변수 클래스는 <html>에 둔다 (2026-11-16 대표 «kopub으로해»): styles/globals.css 의 --font-serif/--font-sans/--font-display 가
    // :root 에서 var(--font-oswald)를 참조하므로, 이 클래스가 <body>에만 있으면 변수가 무효가 되어 사이트 전체가 기기 기본 글꼴로 나온다(5/1~11/16 실제 발생).
    // --font-noto-* 는 2026-11-19부터 styles/globals.css :root 에서 직접 정의한다(위 주석 참고).
    <html lang="ko" className={oswald.variable}>
      <head>
        <JsonLd />
        {/* KoPubWorld 서브셋 폰트 preload — Vercel edge에서 직서빙, 64~122KB.
            바탕(제목 글꼴)은 페이지마다 첫 화면 굵기가 달라 각 페이지에서 따로 미리 받는다 (2026-11-19):
            홈 = 바탕 Medium(app/page.tsx), /join = 바탕 Bold(app/join/layout.tsx). */}
        <link rel="preload" href="/fonts/KoPubWorldDotum-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* 서드파티 도메인 preconnect — TCP+TLS를 미리 열어 스크립트 로딩 지연 감소 */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://t1.kakaocdn.net" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        {/* Supabase preconnect — 클라이언트 인증 갱신·Storage 요청 TCP 핸드셰이크 선점 */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL.trim()} crossOrigin="anonymous" />
        )}
      </head>
      <body>
        <noscript>
          <p style={{ textAlign: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
            이 사이트는 JavaScript가 필요합니다. 브라우저 설정에서 JavaScript를 활성화해주세요.
          </p>
        </noscript>
        <RouteAnnouncer />
        <ConditionalShell>{children}</ConditionalShell>
        <GoogleAnalytics />
        <GAPageTracker />
        <FirstTouchTracker />
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
