import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 대소문자 오타 → 소문자 정규 URL로 301 영구 리다이렉트
      { source: '/Join', destination: '/join', permanent: true },
      { source: '/JOIN', destination: '/join', permanent: true },
      { source: '/Actors', destination: '/actors', permanent: true },
      { source: '/Board', destination: '/board', permanent: true },
    ]
  },
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
  },
};

export default nextConfig;
