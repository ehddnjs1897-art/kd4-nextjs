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

  const copyLink = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(webUrl)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
        .catch(() => prompt('아래 링크를 복사하세요:', webUrl))
    } else {
      prompt('아래 링크를 복사하세요:', webUrl)
    }
  }, [webUrl])

  const mailtoHref = `mailto:?subject=${encodeURIComponent('KD4 배우 프로필 공유')}&body=${encodeURIComponent(`아래 KD4 배우 프로필을 확인해 보세요:\n\n${webUrl}`)}`

  return (
    // 2026-06-12 대표 지시 재디자인: 노란 블록 제거 → 크림+네이비 톤의 동일 아웃라인 버튼 한 줄
    // (에디토리얼 레퍼런스 — 카카오는 공식 심볼 아이콘으로만 식별, 브랜드 노랑 면적 미사용)
    <div style={{ position: 'relative', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
      <button type="button" onClick={share} style={styles.btnPrimary} aria-label="카카오톡 공유">
        <Image src="/icons/kakao.png" alt="" width={16} height={16} style={{ flexShrink: 0 }} />
        카카오톡 공유
      </button>
      <button
        type="button"
        onClick={copyLink}
        aria-label="프로필 링크 복사"
        style={styles.btnSecondary}
      >
        링크 복사
      </button>
      <a
        href={mailtoHref}
        aria-label="이메일로 프로필 공유"
        style={{ ...styles.btnSecondary, textDecoration: 'none' }}
      >
        이메일
      </a>
      {(copied || shared) && (
        <div role="status" aria-live="polite" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30,30,30,0.92)', color: '#fff', fontSize: '0.78rem',
          padding: '6px 12px', borderRadius: 6, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 10,
        }}>
          {shared ? <><span aria-hidden="true">✓</span> 카카오톡 공유 완료</> : <><span aria-hidden="true">✓</span> 링크 복사됨</>}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  // 1순위 액션 — 같은 아웃라인 구조에 브랜드 악센트 색만 (면적 색 채움 금지)
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'transparent',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
    borderRadius: 6,
    padding: '9px 14px',
    minHeight: 40,
    fontSize: '0.8rem',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'transparent',
    color: 'var(--gray)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '9px 14px',
    minHeight: 40,
    fontSize: '0.8rem',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
}
