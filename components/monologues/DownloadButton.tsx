'use client'

import { useState, useEffect } from 'react'

interface Props {
  monologueId: string
}

/**
 * 로그인 여부에 따라 다운로드/로그인유도 링크로 갈리는 버튼.
 * 서버 컴포넌트에서 쿠키(auth.getUser())를 읽으면 페이지 전체가 강제 dynamic
 * 렌더링돼 ISR(revalidate)이 무력화된다(2026-07-14 실측 — 캐시 안 타고 TTFB
 * 0.6~1.2초로 매 요청 재렌더링). 이 버튼만 클라이언트에서 인증 확인하도록
 * 분리해 페이지 나머지는 계속 정적/ISR 캐시를 타게 한다 (Navbar.tsx와 동일 패턴).
 */
export default function DownloadButton({ monologueId }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setIsLoggedIn(false)
      return
    }
    ;(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!cancelled) setIsLoggedIn(!!user)
    })()
    return () => { cancelled = true }
  }, [])

  // 확인 전에는 안전한 기본값(로그인 유도)으로 렌더 — 확인 즉시 필요하면 링크로 갱신
  const loggedIn = isLoggedIn === true
  const href = loggedIn
    ? `/api/monologues/${monologueId}/download`
    : `/auth/login?next=${encodeURIComponent(`/monologues/${monologueId}`)}`

  return (
    <a
      href={href}
      download={loggedIn ? true : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 20,
        padding: '10px 24px',
        borderRadius: 999,
        background: 'var(--navy)',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.85rem',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      ↓ 독백 다운로드
    </a>
  )
}
