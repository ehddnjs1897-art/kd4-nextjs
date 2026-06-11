export default function ActorsLoading() {
  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 80 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div className="container">
        {/* 헤더 스켈레톤 */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={sk(80, 10, '0 auto 12px')} />
          <div style={sk(200, 36, '0 auto 12px')} />
          <div style={sk(280, 16, '0 auto')} />
        </div>
        {/* 필터바 스켈레톤 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, padding: '16px 20px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, flexWrap: 'wrap' as const }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} style={sk(60, 36)} />)}
        </div>
        {/* 카드 그리드 스켈레톤 — 실제와 동일한 2열 3/2 비율 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: 8, aspectRatio: '3/2',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
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
