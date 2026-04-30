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
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // URL 대소문자 정규화 (모바일 자동완성 등 /Join → /join)
  async redirects() {
    return [
      { source: '/Join', destination: '/join', permanent: true },
      { source: '/JOIN', destination: '/join', permanent: true },
      { source: '/Actors', destination: '/actors', permanent: true },
      { source: '/Board', destination: '/board', permanent: true },
    ]
  },
  // 정적 자산 장기 캐시 (Vercel edge에서 처리)
  async headers() {
    return [
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
    ]
  },
};

export default nextConfig;
