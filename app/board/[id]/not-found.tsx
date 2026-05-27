import Link from 'next/link'

export default function PostNotFound() {
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
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          color: 'var(--white)',
          marginBottom: 12,
        }}>
          게시글을 찾을 수 없습니다
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: '0.88rem', marginBottom: 24 }}>
          삭제되었거나 존재하지 않는 게시글입니다.
        </p>
        <Link
          href="/board"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--gold)',
            color: '#fff',
            borderRadius: 6,
            padding: '11px 24px',
            minHeight: 44,
            fontSize: '0.88rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          게시판으로
        </Link>
      </div>
    </div>
  )
}
