/**
 * 업로드 전 이미지 준비 (클라이언트 전용 유틸)
 *
 * ① 아이폰 HEIC/HEIF → JPEG 변환 (heic2any, 동적 import로 메인 번들과 분리)
 * ② 큰 사진은 브라우저에서 리사이즈/재인코딩 — Vercel 서버리스 본문 4.5MB 한계(413) 회피
 *
 * 서버 sharp는 Vercel 기본 빌드에서 HEIC 디코드를 못 하므로, 변환은 브라우저에서 한다.
 * GalleryEditForm(편집)·OnboardingForm(신규가입) 양쪽이 공용으로 사용. (2026-07-01 대표 지시)
 */

const SAFE_UPLOAD_BYTES = 4 * 1024 * 1024

// 아이폰 HEIC/HEIF 감지 — type 또는 확장자로 판별 (브라우저가 type을 비워 보낼 때 대비)
export function isHeic(file: File): boolean {
  const t = (file.type || '').toLowerCase()
  if (t.includes('heic') || t.includes('heif')) return true
  return /\.(heic|heif)$/i.test(file.name || '')
}

// HEIC/HEIF → JPEG 변환
async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  const blob = (Array.isArray(out) ? out[0] : out) as Blob
  const base = (file.name || 'photo').replace(/\.[^.]+$/, '')
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

// 큰 사진은 캔버스로 리사이즈/재인코딩 (최대 2000px, JPEG)
async function compressIfLarge(file: File): Promise<File> {
  if (file.size <= SAFE_UPLOAD_BYTES) return file
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = () => reject(new Error('read'))
      r.readAsDataURL(file)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new window.Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error('decode'))
      im.src = dataUrl
    })
    const maxSide = 2000
    let width = img.naturalWidth || img.width
    let height = img.naturalHeight || img.height
    if (Math.max(width, height) > maxSide) {
      const scale = maxSide / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, width, height)
    for (const q of [0.9, 0.8, 0.7, 0.6]) {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/jpeg', q))
      if (blob && blob.size <= SAFE_UPLOAD_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
      }
    }
    return file
  } catch {
    return file  // 압축 실패 — 원본으로 진행(작은 사진이면 통과)
  }
}

// 업로드 전 이미지 준비: ① HEIC면 JPEG 변환 → ② 크면 리사이즈/압축.
// 아이폰 사진(HEIC)·대용량 스튜디오 사진을 모든 브라우저에서 업로드 통과시킨다.
export async function prepareImageForUpload(file: File): Promise<File> {
  let f = file
  if (isHeic(f)) {
    try {
      f = await convertHeicToJpeg(f)
    } catch {
      throw new Error('아이폰 HEIC 사진 변환에 실패했어요. 사진 앱에서 JPG로 저장한 뒤 다시 올려주세요.')
    }
  }
  return compressIfLarge(f)
}
