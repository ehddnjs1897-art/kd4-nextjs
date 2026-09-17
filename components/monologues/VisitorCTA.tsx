'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import JoinCTALink from '@/components/join/JoinCTALink'

interface Props {
  /** detail = 독백 상세 하단 카드 / list = 목록 중간에 끼우는 한 줄 */
  variant: 'detail' | 'list'
  /** 가입 후 돌아올 주소 (없으면 /monologues) */
  nextPath?: string
}

/**
 * 독백 페이지 방문자 유도 (2026-09-17 대표 지시 — 검색 유입의 대부분이 독백이라 상담·가입으로 잇는다).
 * - 독백 본문은 절대 가리지 않는다(검색 순위가 본문에서 나온다). 본문 아래·목록 중간에 얹기만 한다.
 * - 상담 버튼은 모두에게, 회원가입 버튼은 비로그인 방문자에게만.
 * - 가입 혜택은 «대본 다운로드»만 말한다. 배우 DB는 수강 이후 등록이라 가입 혜택으로 쓰지 않는다(대표 확인).
 * - 로그인 확인은 DownloadButton과 같은 클라이언트 패턴 — 서버에서 쿠키를 읽으면 ISR 캐시가 깨진다.
 */
export default function VisitorCTA({ variant, nextPath = '/monologues' }: Props) {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    ;(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const { data: { user } } = await createClient().auth.getUser()
      if (!cancelled) setLoggedIn(!!user)
    })()
    return () => { cancelled = true }
  }, [])

  const signupHref = `/auth/signup?next=${encodeURIComponent(nextPath)}`
  const linkStyle: React.CSSProperties = { color: 'var(--navy)', fontWeight: 600 }

  const buttons = (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: variant === 'list' ? 'center' : 'flex-start' }}>
      <JoinCTALink href="/join" location={`monologue_${variant}`} label="무료 상담 신청" className="btn-primary" style={{ background: 'var(--navy)', color: '#fff' }}>
        무료 상담 신청 <span aria-hidden="true">→</span>
      </JoinCTALink>
      {!loggedIn && (
        <Link href={signupHref} className="btn-outline">
          회원가입하고 대본 내려받기
        </Link>
      )}
    </div>
  )

  if (variant === 'list') {
    return (
      <aside
        aria-label="상담·회원가입 안내"
        style={{ gridColumn: '1 / -1', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 'clamp(20px, 3.5vw, 28px)', textAlign: 'center' }}
      >
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--black)', marginBottom: 6, wordBreak: 'keep-all' }}>
          독백은 골랐는데, 어떻게 준비할지 막막하다면
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--gray)', lineHeight: 1.7, marginBottom: 16, wordBreak: 'keep-all' }}>
          현역 배우가 직접 지도하는 KD4 액팅 스튜디오에서 무료 상담을 받아보세요.
          {!loggedIn && ' 회원가입은 무료이고, 가입하면 독백 대본을 파일로 내려받을 수 있습니다.'}
        </p>
        {buttons}
      </aside>
    )
  }

  return (
    <aside
      aria-label="오디션 준비 안내"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 'clamp(22px, 4vw, 30px)' }}
    >
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--black)', marginBottom: 10, wordBreak: 'keep-all' }}>
        이 독백으로 오디션을 준비한다면
      </p>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.98rem', lineHeight: 1.9, color: 'var(--black)', marginBottom: 18, wordBreak: 'keep-all' }}>
        <Link href="/meisner-technique-class" style={linkStyle}>마이즈너 테크닉 정규 클래스</Link>에서 레피티션으로 장면을 살리고,{' '}
        <Link href="/reel-production-class" style={linkStyle}>출연영상 제작</Link>으로 포트폴리오를 남깁니다.{' '}
        <Link href="/audition-technique-class" style={linkStyle}>오디션 테크닉 클래스</Link>에서는 나에게 맞는 독백을 고르는 것부터 모의 오디션까지 함께합니다.{' '}
        <Link href="/sinchon-acting-academy" style={linkStyle}>신촌 연기학원 KD4</Link>.
      </p>
      {buttons}
      {!loggedIn && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gray)', marginTop: 12 }}>
          회원가입은 무료이며, 가입하면 독백 대본을 파일로 내려받을 수 있습니다.
        </p>
      )}
    </aside>
  )
}
