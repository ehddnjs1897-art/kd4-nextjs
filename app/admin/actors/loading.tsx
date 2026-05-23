export default function AdminActorsLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 4,
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '60vh', padding: '32px 24px' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{ ...pulse, height: 24, width: 200, marginBottom: 24 }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ ...pulse, height: 40, width: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...pulse, height: 14, width: '40%', marginBottom: 8 }} />
            <div style={{ ...pulse, height: 12, width: '25%' }} />
          </div>
          <div style={{ ...pulse, height: 28, width: 80, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  )
}
