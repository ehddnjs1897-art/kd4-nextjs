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
      // Cloudflare R2 (영상/파일 직접 URL 방어 — 현재는 프록시 경유, 미래 대비)
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
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
          // CSP: 'unsafe-inline'/'unsafe-eval' — Next.js 16 인라인 스크립트 + Three.js/GSAP eval 의존성 필수
          // 'unsafe-eval' 제거하려면 Next.js nonce 기반 CSP 또는 GSAP/Three.js 빌드 없는 별도 번들 필요 (TODO)
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.kakaocdn.net https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://*.supabase.co https://drive.google.com https://lh3.googleusercontent.com https://img.youtube.com https://i.ytimg.com https://*.r2.cloudflarestorage.com; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://graph.facebook.com https://*.r2.cloudflarestorage.com https://kapi.kakao.com https://sharer.kakao.com https://generativelanguage.googleapis.com; media-src 'self' https://*.r2.cloudflarestorage.com; worker-src 'self' blob:; frame-src https://www.youtube.com https://maps.google.com https://www.google.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" },
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
      {
        source: '/og-image.jpg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/placeholder-actor.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/partners/:path*',
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
      {
        source: '/sinchon/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/sounds/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
};

export default nextConfig;
