'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function EnrollError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[Enroll] 렌더링 오류:', error) }, [error])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.35em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 16 }}>오류 발생</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--white)', marginBottom: 12 }}>수강 신청 페이지를 불러오지 못했습니다</h2>
        <p style={{ color: 'var(--gray)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.6 }}>일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={reset} style={{ background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 6, padding: '11px 24px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>다시 시도</button>
          <Link href="/" style={{ background: 'transparent', color: 'var(--gray)', border: '1px solid var(--border)', borderRadius: 6, padding: '11px 24px', fontSize: '0.88rem', textDecoration: 'none', display: 'inline-block' }}>홈으로</Link>
        </div>
      </div>
    </div>
  )
}
