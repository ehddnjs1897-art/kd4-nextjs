export default function InsightsLoading() {
  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 80 }}>
      <div className="container">
        {/* 헤더 스켈레톤 */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={sk(90, 10, '0 auto 12px')} />
          <div style={sk(160, 30, '0 auto 12px')} />
          <div style={sk(260, 16, '0 auto')} />
        </div>
        {/* 카드 그리드 스켈레톤 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={sk('100%', 140, '0 0 12px')} />
              <div style={sk('80%', 16, '0 0 8px')} />
              <div style={sk('55%', 13)} />
            </div>
          ))}
        </div>
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
