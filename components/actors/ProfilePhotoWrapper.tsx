'use client'

/**
 * 배우 상세 페이지 사이드바 프로필 사진 래퍼.
 * imageProtected=true (배우 회원): CSS background-image + 우클릭 차단
 * imageProtected=false (디렉터/관리자): <img> 태그 정상 렌더 + 다운로드 링크
 */

interface Props {
  src: string
  alt: string
  downloadHref?: string  // 디렉터용 Google Drive 다운로드 URL
  imageProtected: boolean
}

export default function ProfilePhotoWrapper({ src, alt, downloadHref, imageProtected }: Props) {
  if (imageProtected) {
    return (
      <div
        style={{
          ...wrapStyles,
          backgroundImage: `url("${src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* 투명 오버레이 */}
        <div style={overlayStyle} />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{ ...wrapStyles, objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
      />
      {downloadHref && (
        <a
          href={downloadHref}
          target="_blank"
          rel="noopener noreferrer"
          style={downloadBtnStyle}
          title="프로필 사진 다운로드"
        >
          ↓ 프로필 저장
        </a>
      )}
    </div>
  )
}

const wrapStyles: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '9/16',
  borderRadius: 8,
  overflow: 'hidden',
  background: 'var(--bg3)',
  width: '100%',
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  cursor: 'default',
}

const downloadBtnStyle: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  padding: '7px 0',
  marginTop: 6,
  fontSize: '0.78rem',
  color: 'var(--gold)',
  textDecoration: 'none',
  border: '1px solid rgba(196,165,90,0.3)',
  borderRadius: 4,
  background: 'rgba(196,165,90,0.06)',
  letterSpacing: '0.04em',
}
