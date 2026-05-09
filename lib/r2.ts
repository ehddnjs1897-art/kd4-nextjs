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
const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? 'kd4-actor-videos'

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error('[r2] R2 환경변수 누락 (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)')
  }
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  })
  return client
}

/** R2가 셋업되었는지 빠르게 확인 (env 기반) */
export function isR2Configured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY)
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
 * Signed URL 발급 — 시간제한 비공개 다운로드/재생 링크
 * @param key R2 경로
 * @param expiresInSec 만료 시간 (초). 기본 24시간.
 */
export async function getVideoSignedUrl(
  key: string,
  expiresInSec = 86400
): Promise<string> {
  const c = getClient()
  return getSignedUrl(
    c,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    { expiresIn: expiresInSec }
  )
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
  const ext = originalFileName.split('.').pop()?.toLowerCase() || 'mp4'
  const timestamp = Date.now()
  return `actors/${actorId}/${timestamp}.${ext}`
}
