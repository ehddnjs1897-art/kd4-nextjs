'use client'

/**
 * PhotoUpload — 9:16 비율 center-crop + Supabase Storage 업로드
 *
 * Props:
 *   actorId          — 배우 ID (업로드 경로 및 권한 확인용)
 *   onUploadComplete — 업로드 성공 시 { url, path } 콜백
 *   label            — 버튼 위에 표시할 레이블 (기본값: "사진 업로드")
 */
import React, { useRef, useState } from 'react'

export interface UploadResult {
  url: string
  path: string
}

interface PhotoUploadProps {
  actorId: string
  onUploadComplete: (result: UploadResult) => void
  label?: string
}

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// ── 9:16 center-crop ──────────────────────────────────────────────────────────
function cropTo9x16(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const targetRatio = 9 / 16
      let srcX = 0,
        srcY = 0,
        srcW = img.width,
        srcH = img.height

      if (img.width / img.height > targetRatio) {
        // 이미지가 더 넓음 → 가로 크롭
        srcW = img.height * targetRatio
        srcX = (img.width - srcW) / 2
      } else {
        // 이미지가 더 높음 → 세로 크롭
        srcH = img.width / targetRatio
        srcY = (img.height - srcH) / 2
      }

      canvas.width = 900
      canvas.height = 1600
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 900, 1600)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92)
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function PhotoUpload({
  actorId,
  onUploadComplete,
  label = '사진 업로드',
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  // ── 파일 선택 처리 ─────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setDone(false)

    // 클라이언트 사이즈 체크
    if (file.size > MAX_SIZE) {
      setError(
        `파일 크기가 너무 큽니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB, 최대: 5MB)`
      )
      return
    }

    try {
      const blob = await cropTo9x16(file)
      setCroppedBlob(blob)
      const objectUrl = URL.createObjectURL(blob)
      setPreviewUrl(objectUrl)
    } catch {
      setError('이미지 처리 중 오류가 발생했습니다.')
    }
  }

  // ── 업로드 ─────────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!croppedBlob) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append(
        'file',
        new File([croppedBlob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      )
      formData.append('actorId', actorId)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? '업로드에 실패했습니다.')
        return
      }

      setDone(true)
      onUploadComplete({ url: json.url, path: json.path })
      // 상태 초기화
      setPreviewUrl(null)
      setCroppedBlob(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setUploading(false)
    }
  }

  function handleReset() {
    setPreviewUrl(null)
    setCroppedBlob(null)
    setError(null)
    setDone(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={s.wrap}>
      {/* 레이블 */}
      <p style={s.label}>{label}</p>

      {/* 파일 선택 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id={`photo-input-${actorId}-${label}`}
      />

      {!previewUrl ? (
        <label
          htmlFor={`photo-input-${actorId}-${label}`}
          style={s.dropzone}
        >
          <span style={s.dropIcon}>+</span>
          <span style={s.dropText}>클릭하여 이미지 선택</span>
          <span style={s.dropHint}>JPG · PNG · WEBP / 최대 5MB</span>
        </label>
      ) : (
        <div style={s.previewWrap}>
          {/* 9:16 미리보기 컨테이너 */}
          <div style={s.previewFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="크롭 미리보기" style={s.previewImg} />
            <span style={s.cropBadge}>9:16</span>
          </div>

          <div style={s.actions}>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              style={uploading ? { ...s.btnPrimary, ...s.btnDisabled } : s.btnPrimary}
            >
              {uploading ? '업로드 중…' : '업로드'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={uploading}
              style={s.btnSecondary}
            >
              다시 선택
            </button>
          </div>
        </div>
      )}

      {/* 오류 */}
      {error && <p style={s.errorMsg}>{error}</p>}

      {/* 성공 */}
      {done && <p style={s.successMsg}>업로드가 완료되었습니다.</p>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: 'var(--gray)',
    textTransform: 'uppercase',
  },
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: '1.5px dashed var(--border)',
    borderRadius: 8,
    padding: '32px 20px',
    cursor: 'pointer',
    background: 'var(--bg3)',
    transition: 'border-color 0.2s',
  },
  dropIcon: {
    fontSize: '2rem',
    lineHeight: 1,
    color: 'var(--gold)',
    fontWeight: 300,
  },
  dropText: {
    fontSize: '0.88rem',
    color: 'var(--white)',
  },
  dropHint: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
  },
  previewWrap: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  previewFrame: {
    position: 'relative',
    width: 90,
    height: 160,
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    flexShrink: 0,
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cropBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    background: 'rgba(0,0,0,0.7)',
    color: 'var(--gold)',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: 3,
    letterSpacing: '0.05em',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 4,
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 5,
    padding: '9px 20px',
    fontSize: '0.83rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.04em',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  btnSecondary: {
    background: 'transparent',
    color: 'var(--gray)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    padding: '8px 20px',
    fontSize: '0.83rem',
    cursor: 'pointer',
  },
  errorMsg: {
    fontSize: '0.8rem',
    color: '#f87171',
  },
  successMsg: {
    fontSize: '0.8rem',
    color: '#4ade80',
  },
}
