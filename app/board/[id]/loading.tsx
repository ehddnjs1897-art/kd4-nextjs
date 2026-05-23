export default function BoardPostLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 6,
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 100, paddingBottom: 80 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...pulse, height: 10, width: 60, marginBottom: 14 }} />
          <div style={{ ...pulse, height: 28, width: '70%', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ ...pulse, height: 12, width: 80 }} />
            <div style={{ ...pulse, height: 12, width: 60 }} />
          </div>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
            {[100, 80, 90, 70].map((w, i) => (
              <div key={i} style={{ ...pulse, height: 14, width: `${w}%`, marginBottom: 10 }} />
            ))}
          </div>
        </div>
        {/* 댓글 스켈레톤 */}
        {[1, 2].map(i => (
          <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ ...pulse, height: 12, width: 100, marginBottom: 10 }} />
            <div style={{ ...pulse, height: 12, width: '60%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
