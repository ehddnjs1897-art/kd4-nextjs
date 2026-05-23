export default function LeaderboardLoading() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: '20px',
        fontFamily: 'var(--font-oswald), sans-serif',
        color: '#fff',
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div style={{ width: 60, height: 14, background: '#1a1a1a', borderRadius: 4 }} />
        <div style={{ width: 120, height: 20, background: '#1a1a1a', borderRadius: 4 }} />
        <div style={{ width: 60 }} />
      </div>

      {/* Toggle skeleton */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <div style={{ width: 80, height: 36, background: '#1a1a1a', borderRadius: 8 }} />
        <div style={{ width: 80, height: 36, background: '#1a1a1a', borderRadius: 8 }} />
      </div>

      {/* Row skeletons */}
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              marginBottom: 4,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ width: 28, height: 18, background: '#1a1a1a', borderRadius: 3 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: 100, height: 14, background: '#1a1a1a', borderRadius: 3, marginBottom: 6 }} />
              <div style={{ width: 70, height: 11, background: '#111', borderRadius: 3 }} />
            </div>
            <div style={{ width: 50, height: 20, background: '#1a1a1a', borderRadius: 3 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
