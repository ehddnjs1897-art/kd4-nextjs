export default function BoardLoading() {
  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
      <div className="container">
        {/* 헤더 스켈레톤 */}
        <div style={{ marginBottom: 48 }}>
          <div style={sk(80, 10, '0 0 12px')} />
          <div style={sk(160, 32)} />
        </div>
        {/* 탭 스켈레톤 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} style={sk(64, 34)} />)}
        </div>
        {/* 목록 스켈레톤 */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={sk(48, 20)} />
            <div style={{ flex: 1 }}>
              <div style={sk('70%', 18, '0 0 8px')} />
              <div style={sk('30%', 13)} />
            </div>
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
