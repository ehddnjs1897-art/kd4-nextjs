import Link from 'next/link'

export default function ActorNotFound() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.68rem',
          letterSpacing: '0.35em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          404
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          color: 'var(--white)',
          marginBottom: 12,
        }}>
          배우를 찾을 수 없습니다
        </h2>
        <p style={{ color: 'var(--gray)', fontSize: '0.88rem', marginBottom: 24 }}>
          삭제되었거나 존재하지 않는 배우 페이지입니다.
        </p>
        <Link
          href="/actors"
          style={{
            display: 'inline-block',
            background: 'var(--gold)',
            color: '#fff',
            borderRadius: 6,
            padding: '11px 24px',
            fontSize: '0.88rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          배우 목록으로
        </Link>
      </div>
    </div>
  )
}
