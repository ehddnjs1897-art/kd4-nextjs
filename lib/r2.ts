import 'server-only'

/**
 * Cloudflare R2 클라이언트 (S3 호환)
 *
 * KD4 영상 파일 호스팅 — Supabase Storage 대신 R2 사용으로 비용 ↓ + egress 무료.
 *
 * 환경변수 (서버 전용):
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME      = "kd4-actor-videos"
 *
 * 모든 영상은 private 버킷에 저장. 인증된 사용자만 signed URL 발급 받아 접근.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET_NAME = process.env.R2_BUCKET_NAME

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
    throw new Error('[r2] R2 환경변수 누락 (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME)')
  }
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
    // AWS SDK v3가 기본으로 presigned URL에 x-amz-checksum-* 서명 헤더를 넣어
    // 브라우저 재생/다운로드 시 SignatureDoesNotMatch 발생 → 체크섬 비활성화.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  return client
}

/** R2가 셋업되었는지 빠르게 확인 (env 기반) */
export function isR2Configured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET_NAME)
}

/**
 * 영상 업로드 — admin 패널/마이그레이션 스크립트에서 호출
 * @param key 저장 경로 (예: "actors/{uuid}/main.mp4")
 * @param body 파일 바이너리
 * @param contentType MIME (예: "video/mp4")
 */
export async function uploadVideo(
  key: string,
  body: Buffer | Uint8Array,
  contentType = 'video/mp4'
): Promise<void> {
  const c = getClient()
  await c.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

/**
 * 업로드용 presigned PUT URL 발급 — 브라우저가 R2로 "직접" 업로드.
 * Vercel 서버리스 본문 4.5MB 제한을 우회하기 위함 (300MB 영상 대응).
 * 발급된 URL로 브라우저가 PUT 하면 파일이 R2에 바로 저장됨.
 * @param key R2 경로
 * @param contentType MIME (예: "video/mp4")
 * @param expiresInSec 만료 시간 (초). 기본 1시간.
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresInSec = 3600
): Promise<string> {
  const c = getClient()
  return getSignedUrl(
    c,
    new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSec }
  )
}

/**
 * Signed URL 발급 — 시간제한 비공개 다운로드/재생 링크
 * @param key R2 경로
 * @param expiresInSec 만료 시간 (초). 기본 24시간.
 */
export async function getVideoSignedUrl(
  key: string,
  expiresInSec = 86400,
  downloadFilename?: string
): Promise<string> {
  const c = getClient()
  return getSignedUrl(
    c,
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      // downloadFilename 지정 시 브라우저가 "다운로드"로 처리 (스트리밍 대신)
      ...(downloadFilename
        ? { ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(downloadFilename)}` }
        : {}),
    }),
    { expiresIn: expiresInSec }
  )
}

/**
 * 객체를 서버에서 직접 스트림으로 가져온다 (same-origin 프록시 다운로드용).
 * presigned URL을 브라우저에 직접 주면 R2가 inline 렌더하거나 CORS에 막혀
 * 강제 다운로드가 보장되지 않음 → 우리 서버가 Content-Disposition을 붙여 재서빙.
 * @param key R2 경로
 */
export async function getObjectStream(key: string): Promise<{
  body: ReadableStream
  contentType?: string
  contentLength?: number
}> {
  const c = getClient()
  const res = await c.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
  if (!res.Body) throw new Error('[r2] 객체 본문이 비어있음')
  const body = (res.Body as { transformToWebStream: () => ReadableStream }).transformToWebStream()
  return { body, contentType: res.ContentType, contentLength: res.ContentLength }
}

/** 영상 삭제 (admin) */
export async function deleteVideo(key: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
}

/** 영상 존재 확인 */
export async function videoExists(key: string): Promise<boolean> {
  const c = getClient()
  try {
    await c.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
    return true
  } catch {
    return false
  }
}

/** R2 key 생성 컨벤션 — 일관된 경로 보장 */
export function buildVideoKey(actorId: string, originalFileName: string): string {
  const rawExt = originalFileName.split('.').pop()?.toLowerCase() || ''
  const SAFE_EXTS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v']
  const ext = SAFE_EXTS.includes(rawExt) ? rawExt : 'mp4'
  const timestamp = Date.now()
  return `actors/${actorId}/${timestamp}.${ext}`
}
