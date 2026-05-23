import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google Drive 썸네일
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // YouTube 썸네일 (img.youtube.com/vi/{id}/mqdefault.jpg)
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      // Google 사용자 콘텐츠 (Drive 뷰어 리다이렉트 대상)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap', 'three'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  // URL 대소문자 정규화는 middleware.ts에서 처리 (Next.js 16 redirects 무한루프 회피)
  // 보안 헤더 + 정적 자산 장기 캐시
  async headers() {
    return [
      // ── 전체 경로 보안 헤더 ───────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS: 2년 + subDomains + preload (HTTPS 전용 사이트)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // CSP: Next.js 인라인 스크립트(unsafe-inline/unsafe-eval) + Meta/GA4/Kakao
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.kakaocdn.net https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://drive.google.com https://lh3.googleusercontent.com https://img.youtube.com https://*.r2.cloudflarestorage.com; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://graph.facebook.com https://*.r2.cloudflarestorage.com https://kapi.kakao.com https://sharer.kakao.com; media-src 'self' https://*.r2.cloudflarestorage.com; frame-src https://www.youtube.com https://maps.google.com https://www.google.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
      // ── 정적 자산 캐시 ────────────────────────────────────────
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/casting/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/director.jpg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/heart-logo.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/sinchon-route-map.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      // KoPub 폰트 woff2 — 파일명으로 버전관리(pyftsubset 고정), immutable 안전
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
};

export default nextConfig;
