export default function ClassesLoading() {
  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 80 }}>
      <div className="container">
        {/* 헤더 스켈레톤 */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={sk(80, 10, '0 auto 12px')} />
          <div style={sk(180, 30, '0 auto 12px')} />
          <div style={sk(300, 16, '0 auto')} />
        </div>
        {/* 클래스 카드 스켈레톤 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
              <div style={sk(120, 14, '0 0 12px')} />
              <div style={sk('60%', 24, '0 0 12px')} />
              <div style={sk('90%', 14, '0 0 6px')} />
              <div style={sk('75%', 14)} />
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
