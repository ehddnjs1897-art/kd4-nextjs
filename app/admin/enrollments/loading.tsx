export default function AdminEnrollmentsLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 4,
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return (
    <div style={{ minHeight: '60vh', padding: '32px 24px' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{ ...pulse, height: 24, width: 220, marginBottom: 24 }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ flex: 2 }}>
            <div style={{ ...pulse, height: 14, width: '70%', marginBottom: 6 }} />
            <div style={{ ...pulse, height: 11, width: '45%' }} />
          </div>
          <div style={{ ...pulse, height: 24, width: 70, borderRadius: 12 }} />
          <div style={{ ...pulse, height: 28, width: 60, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  )
}
