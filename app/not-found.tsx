import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '5rem',
            fontWeight: 900,
            color: 'var(--gold)',
            lineHeight: 1,
            marginBottom: '16px',
            opacity: 0.6,
          }}
        >
          404
        </p>
        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--white)',
            marginBottom: '12px',
          }}
        >
          페이지를 찾을 수 없습니다
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--gray)',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              padding: '12px 28px',
              background: 'var(--gold)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
            }}
          >
            홈으로
          </Link>
          <Link
            href="/about"
            style={{
              padding: '12px 28px',
              border: '1px solid var(--border)',
              color: 'var(--gray)',
              fontSize: '0.88rem',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
            }}
          >
            스튜디오 소개
          </Link>
        </div>
      </div>
    </div>
  )
}
