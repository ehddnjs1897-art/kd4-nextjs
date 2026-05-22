export default function EnrollLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 4,
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 64 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(64px,12vw,120px) 24px', textAlign: 'center' }}>
        <div style={{ ...pulse, height: 12, width: 140, borderRadius: 3, margin: '0 auto 20px' }} />
        <div style={{ ...pulse, height: 36, width: '70%', borderRadius: 6, margin: '0 auto 16px' }} />
        <div style={{ ...pulse, height: 16, width: '85%', borderRadius: 4, margin: '0 auto 8px' }} />
        <div style={{ ...pulse, height: 16, width: '65%', borderRadius: 4, margin: '0 auto 32px' }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <div style={{ ...pulse, height: 44, width: 100, borderRadius: 6 }} />
          <div style={{ ...pulse, height: 44, width: 100, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  )
}
