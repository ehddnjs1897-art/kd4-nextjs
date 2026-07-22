import 'server-only'
import sharp from 'sharp'

/**
 * 서버측 이미지 자동 압축 (2026-07-23 대표 지시: "매번 업로드하면 압축하게 셋팅")
 *
 * Supabase 무료 플랜(스토리지 1GB) 전환 후 원본 그대로 저장하면 한도가 금방 참 —
 * 폰 원본(4000px+, 5~15MB)을 웹 표시에 충분한 1920px·JPEG q82로 줄여 저장한다.
 * 실측(7/23 일괄 압축): 화질 체감 차이 없이 평균 70%+ 절감.
 *
 * - EXIF 회전을 픽셀에 반영(rotate) — 회전 메타 소실로 눕는 사진 방지
 * - PNG 투명 배경은 흰색으로 플래튼 후 JPEG 변환
 * - GIF(애니메이션 가능)는 건드리지 않음 — 호출측에서 제외
 * - 압축 결과가 원본의 90% 이상이면(이득 미미) null 반환 → 원본 그대로 업로드
 */
export async function compressImageBuffer(
  input: Buffer
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' } | null> {
  try {
    const out = await sharp(input)
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()
    if (out.length >= input.length * 0.9) return null
    return { buffer: out, contentType: 'image/jpeg' }
  } catch {
    // 디코드 실패(손상 파일 등) — 압축 포기하고 원본 업로드 (업로드 자체를 막지 않음)
    return null
  }
}
