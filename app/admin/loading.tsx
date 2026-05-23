export default function AdminLoading() {
  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
      <div className="container">
        {/* 헤더 스켈레톤 */}
        <div style={{ marginBottom: 40 }}>
          <div style={sk(120, 12, '0 0 12px')} />
          <div style={sk(240, 36)} />
        </div>
        {/* 탭 스켈레톤 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} style={sk(80, 36)} />)}
        </div>
        {/* 테이블 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} style={sk('80%', 14)} />)}
        </div>
        {/* 테이블 행 스켈레톤 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            {Array.from({ length: 5 }).map((_, j) => <div key={j} style={sk('70%', 14)} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

function sk(width: number | string, height: number, margin?: string): React.CSSProperties {
  return {
    width,
    height,
    margin: margin ?? 0,
    borderRadius: 6,
    background: 'var(--bg3)',
    animation: 'pulse 1.5s ease-in-out infinite',
  }
}
