'use client'

import { useEffect } from 'react'

interface Props {
  title: string
  description: string
  imageUrl: string
  webUrl: string
}

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void
      isInitialized: () => boolean
      Share: {
        sendDefault: (options: KakaoShareOptions) => void
      }
    }
  }
}

interface KakaoShareOptions {
  objectType: 'feed'
  content: {
    title: string
    description: string
    imageUrl: string
    link: {
      webUrl: string
      mobileWebUrl: string
    }
  }
  buttons?: {
    title: string
    link: { webUrl: string; mobileWebUrl: string }
  }[]
}

export default function ShareButton({ title, description, imageUrl, webUrl }: Props) {
  useEffect(() => {
    const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!jsKey) return

    const tryInit = () => {
      if (typeof window !== 'undefined' && window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(jsKey)
        }
        return true
      }
      return false
    }

    // SDK가 이미 로드된 경우 즉시 초기화
    if (!tryInit()) {
      // SDK 로딩 대기 (layout.tsx Script afterInteractive 기준)
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval)
      }, 200)
      return () => clearInterval(interval)
    }
  }, [])

  function handleShare() {
    if (typeof window === 'undefined' || !window.Kakao) {
      alert('카카오 SDK를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!jsKey) {
      alert('카카오 공유 설정이 올바르지 않습니다.')
      return
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(jsKey)
    }

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl,
        link: {
          webUrl,
          mobileWebUrl: webUrl,
        },
      },
      buttons: [
        {
          title: '배우 갤러리 보기',
          link: { webUrl, mobileWebUrl: webUrl },
        },
      ],
    })
  }

  return (
    <button onClick={handleShare} style={styles.btn} aria-label="카카오 공유하기">
      <KakaoShareIcon />
      카카오 공유
    </button>
  )
}

function KakaoShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="#3C1E1E"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.72 1.68 5.12 4.2 6.56l-1.08 4 4.36-2.88c.8.12 1.64.2 2.52.2 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
    </svg>
  )
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#FEE500',
    color: '#3C1E1E',
    border: 'none',
    borderRadius: 6,
    padding: '9px 16px',
    fontSize: '0.85rem',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    width: '100%',
    justifyContent: 'center',
  },
}
