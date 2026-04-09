/**
 * Storage 추상화 레이어
 *
 * Phase A: Supabase Storage (STORAGE_PROVIDER=supabase, 기본값)
 * Phase B: Cloudflare R2  (STORAGE_PROVIDER=r2)
 *
 * STORAGE_PROVIDER 환경변수 값만 바꾸면 Phase A → B 전환 가능.
 * 이 파일은 서버 전용(Server Component / API Route / Server Action).
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

const PROVIDER = (process.env.STORAGE_PROVIDER || 'supabase') as 'supabase' | 'r2'

export interface UploadResult {
  url: string
  path: string
  provider: 'supabase' | 'r2'
}

/**
 * 파일 업로드
 * @param file      업로드할 File 또는 Blob (multipart form 등에서 전달)
 * @param bucket    Supabase Storage 버킷 이름
 * @param actorId   배우 ID (경로 구성에 사용)
 * @param filename  원본 파일명
 */
export async function uploadFile(
  file: File | Blob,
  bucket: string,
  actorId: string,
  filename: string
): Promise<UploadResult> {
  const path = `actors/${actorId}/${Date.now()}_${filename}`

  if (PROVIDER === 'supabase') {
    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, file, {
      upsert: false,
    })

    if (error) {
      throw new Error(`Supabase Storage 업로드 실패: ${error.message}`)
    }

    const url = getPublicUrl(path, bucket)
    return { url, path, provider: 'supabase' }
  }

  // Phase B — R2
  // TODO: Cloudflare R2 연동 구현
  throw new Error('R2 not yet configured')
}

/**
 * 파일 삭제
 */
export async function deleteFile(path: string, bucket: string): Promise<void> {
  if (PROVIDER === 'supabase') {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path])
    if (error) {
      throw new Error(`Supabase Storage 삭제 실패: ${error.message}`)
    }
    return
  }

  // Phase B — R2
  // TODO: Cloudflare R2 연동 구현
  throw new Error('R2 not yet configured')
}

/**
 * 공개 URL 반환 (서명 없는 퍼블릭 버킷 전용)
 */
export function getPublicUrl(path: string, bucket: string): string {
  if (PROVIDER === 'supabase') {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  // Phase B — R2
  // TODO: Cloudflare R2 public URL 조합
  throw new Error('R2 not yet configured')
}
