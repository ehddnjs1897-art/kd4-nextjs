export default function PlayLoading() {
  return (
    <div
      role="status"
      aria-label="로딩 중"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020202',
        color: '#333',
        fontFamily: 'var(--font-oswald), sans-serif',
        fontSize: 13,
        letterSpacing: '0.2em',
      }}
    >
      LOADING...
    </div>
  )
}
