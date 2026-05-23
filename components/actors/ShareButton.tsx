'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  webUrl: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ShareButton({ webUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const share = useCallback(() => {
    const Kakao = (window as any).Kakao
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (Kakao && key) {
      try {
        if (!Kakao.isInitialized()) Kakao.init(key)
        // 페이지 OG 태그(캐스팅 카드)를 그대로 긁어 공유 → 이미지·제목 자동
        Kakao.Share.sendScrap({ requestUrl: webUrl })
        setShared(true)
        setTimeout(() => setShared(false), 2500)
        return
      } catch (e) {
        console.error('[kakao share] 실패, 링크 복사로 폴백:', e)
      }
    }
    // 폴백: 클립보드 복사
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(webUrl)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        })
        .catch(() => prompt('아래 링크를 복사하세요:', webUrl))
    } else {
      prompt('아래 링크를 복사하세요:', webUrl)
    }
  }, [webUrl])

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={share} style={styles.btn} aria-label="카카오톡 공유">
        <Image src="/icons/kakao.png" alt="" width={18} height={18} style={{ flexShrink: 0 }} />
        카카오톡 공유
      </button>
      {(copied || shared) && (
        <div role="status" aria-live="polite" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30,30,30,0.92)', color: '#fff', fontSize: '0.78rem',
          padding: '6px 12px', borderRadius: 6, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 10,
        }}>
          {shared ? '✓ 카카오톡 공유 완료' : '✓ 링크 복사됨 — 카카오톡에 붙여넣어 공유하세요'}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#FEE500', // 카카오 공식 노랑
    color: '#191600',
    border: 'none',
    borderRadius: 8,
    padding: '12px 16px',
    minHeight: 44,
    fontSize: '0.9rem',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.15s',
  },
}
