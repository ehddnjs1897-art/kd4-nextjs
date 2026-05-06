// Server Component — 'use client' 불필요 (훅 미사용)
// SPA 페이지 추적은 GAPageTracker 클라이언트 컴포넌트가 담당
import Script from 'next/script'

// Vercel env 끝에 개행이 들어가면 GA가 측정 ID 인식 못해 데이터가 통째로 누락된다 — trim 필수
const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? 'G-8122KKQZ99').trim()

export default function GoogleAnalytics() {
  // 개발 환경에서는 GA4 비활성화 (데이터 오염 방지)
  if (process.env.NODE_ENV !== 'production') return null
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
