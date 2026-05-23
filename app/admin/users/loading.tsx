export default function AdminUsersLoading() {
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
      <div style={{ ...pulse, height: 24, width: 180, marginBottom: 24 }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ ...pulse, width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...pulse, height: 13, width: '35%', marginBottom: 6 }} />
            <div style={{ ...pulse, height: 11, width: '50%' }} />
          </div>
          <div style={{ ...pulse, height: 24, width: 60, borderRadius: 12 }} />
          <div style={{ ...pulse, height: 28, width: 80, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  )
}
