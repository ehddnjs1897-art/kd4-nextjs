'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  webUrl: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ShareButton({ webUrl }: Props) {
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied'>('idle')

  const share = useCallback(() => {
    const Kakao = (window as any).Kakao
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (Kakao && key) {
      try {
        if (!Kakao.isInitialized()) Kakao.init(key)
        Kakao.Share.sendScrap({ requestUrl: webUrl })
        setStatus('shared')
        setTimeout(() => setStatus('idle'), 2500)
        return
      } catch (e) {
        console.error('[kakao share] 실패, 링크 복사로 폴백:', e)
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(webUrl)
        .then(() => { setStatus('copied'); setTimeout(() => setStatus('idle'), 2500) })
        .catch(() => prompt('아래 링크를 복사하세요:', webUrl))
    } else {
      prompt('아래 링크를 복사하세요:', webUrl)
    }
  }, [webUrl])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={share}
        style={styles.btn}
        aria-label="카카오톡으로 배우 프로필 전달"
      >
        <Image src="/icons/kakao.png" alt="" width={18} height={18} style={{ flexShrink: 0 }} />
        카카오톡 전달 링크
      </button>
      {status !== 'idle' && (
        <div role="status" aria-live="polite" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30,30,30,0.92)', color: '#fff', fontSize: '0.78rem',
          padding: '6px 12px', borderRadius: 6, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 10,
        }}>
          {status === 'shared' ? '✓ 카카오톡 공유 완료' : '✓ 링크 복사됨'}
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
    background: 'transparent',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
    borderRadius: 8,
    padding: '12px 20px',
    minHeight: 44,
    fontSize: '0.88rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.15s',
  },
}
