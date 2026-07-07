/**
 * 동적 OG 이미지 — 배우 캐스팅 카드 자동 생성
 *
 * 카카오톡·페이스북·트위터에서 https://kd4.club/actors/{id} 링크 공유 시
 * 이 라우트가 1200×630 PNG 캐스팅 카드를 생성해 미리보기로 표시.
 *
 * 레이아웃: 풀배경 사진 + 다크 그라디언트 오버레이 + 하단 텍스트
 * → 가로(16:9) 사진에 최적화, 세로 사진도 cover로 표시됨
 *
 * 사용:
 *   <meta property="og:image" content="https://kd4.club/api/og/actor/{id}" />
 *
 * 캐싱: Vercel Edge CDN 24시간
 */

import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'
import { SHOW_CASTING_TAGS } from '@/lib/access'

export const runtime = 'nodejs'
export const revalidate = 3600 // 1h — 배우가 프로필 수정해도 최대 1시간 내 OG 이미지 갱신

// IP 레이트 리밋: 30 req/min (CDN이 1차 방어, in-memory는 2차 — per-edge-instance)
const ogRateMap = new Map<string, { count: number; resetAt: number }>()
const OG_RATE_LIMIT = 30
const OG_RATE_WINDOW_MS = 60_000

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

interface ActorOg {
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  birth_year: number | null
  height: number | null
  skills: string[] | null
  drive_photo_id: string | null
  storage_photo_path: string | null
  profile_photo: string | null
  casting_tags: string[] | null
  casting_summary: string | null
}

async function fetchActor(id: string): Promise<ActorOg | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/actors?id=eq.${encodeURIComponent(id)}&is_public=eq.true&select=name,gender,age_group,birth_year,height,skills,drive_photo_id,storage_photo_path,profile_photo,casting_tags,casting_summary&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600, tags: ['actors', `actor-${id}`] },
    }
  )
  if (!res.ok) return null
  const rows = (await res.json()) as ActorOg[]
  return rows[0] ?? null
}

/** 외부 URL 허용 도메인 (SSRF 방어 — OG 이미지는 Edge에서 직접 fetch함) */
function isSafeOgUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== 'https:') return false
    const ALLOWED = [
      'drive.google.com',
      'lh3.googleusercontent.com',
      'i.ytimg.com',
    ]
    const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null
    if (supabaseHost && hostname === supabaseHost) return true
    return ALLOWED.includes(hostname)
  } catch {
    return false
  }
}

function getPhotoUrl(actor: ActorOg): string | null {
  if (actor.profile_photo && isSafeOgUrl(actor.profile_photo)) return actor.profile_photo
  if (actor.storage_photo_path && SUPABASE_URL) {
    // 경로 순회 공격 방지
    if (actor.storage_photo_path.split('/').some((seg: string) => seg === '..' || seg === '.')) return null
    return `${SUPABASE_URL}/storage/v1/object/public/actor-photos/${actor.storage_photo_path}`
  }
  if (actor.drive_photo_id) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(actor.drive_photo_id)}&sz=w1200`
  }
  return null
}

/** 이미지 헤더(앞 64KB)만 Range로 읽어 가로/세로 크기 판별 (full 디코드 없이). */
async function imageDims(url: string): Promise<{ w: number; h: number } | null> {
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-65535' }, signal: AbortSignal.timeout(5000) })
    if (!res.ok && res.status !== 206) return null
    const buf = Buffer.from(await res.arrayBuffer())
    // PNG — IHDR(고정 오프셋)
    if (buf.length >= 24 && buf.toString('hex', 0, 8) === '89504e470d0a1a0a') {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
    }
    // JPEG — SOF 마커 스캔
    let o = 2
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) { o++; continue }
      const m = buf[o + 1]
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) }
      }
      if (m === 0xd8 || m === 0xd9 || (m >= 0xd0 && m <= 0xd7)) { o += 2; continue }
      o += 2 + buf.readUInt16BE(o + 2)
    }
    return null
  } catch {
    return null
  }
}

/** 썸네일(가로 1200×630)용 — 배우 포트폴리오 사진 중 '가로' 첫 장 URL. 없으면 null → 대표사진 폴백. */
async function pickLandscapeUrl(id: string): Promise<string | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/actor_photos?actor_id=eq.${encodeURIComponent(id)}&select=url,storage_path,photo_type,sort_order&order=sort_order.asc`,
      {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 3600, tags: ['actors', `actor-${id}`] },
      }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as { url: string | null; storage_path: string | null; photo_type: string | null }[]
    const candidates = rows
      .filter((p) => p.photo_type !== 'current')  // 전신 각도(현재사진) 제외 — 포트폴리오 사진만
      .map((p) => p.url ?? (p.storage_path ? `${SUPABASE_URL}/storage/v1/object/public/actor-photos/${p.storage_path}` : null))
      .filter((u): u is string => !!u && isSafeOgUrl(u))
      .slice(0, 8)
    if (candidates.length === 0) return null
    // 병렬 측정 후 sort_order 순서대로 첫 가로 사진 선택
    const measured = await Promise.all(candidates.map((u) => imageDims(u).then((d) => ({ u, d }))))
    for (const { u, d } of measured) {
      if (d && d.w > d.h * 1.05) return u
    }
    return null
  } catch {
    return null
  }
}

const UUID_RE_OG = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const fallbackImage = (
  <div
    style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#0A0A0A', fontSize: 24,
      color: 'rgba(255,255,255,0.2)', fontFamily: 'sans-serif', letterSpacing: '0.15em',
    }}
  >
    kd4.club
  </div>
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // IP 레이트 리밋: 30 req/min (CDN miss 시 Supabase 과부하 방어)
  // x-real-ip 없는 환경(로컬·프리뷰)은 '__unknown__' 키로 묶어 동일하게 제한
  const ip = request.headers.get('x-real-ip') ?? '__unknown__'
  const nowOG = Date.now()
  const bucketOG = ogRateMap.get(ip)
  if (bucketOG && nowOG < bucketOG.resetAt) {
    if (bucketOG.count >= OG_RATE_LIMIT) {
      return new ImageResponse(fallbackImage, { width: 1200, height: 630 })
    }
    bucketOG.count++
  } else {
    ogRateMap.set(ip, { count: 1, resetAt: nowOG + OG_RATE_WINDOW_MS })
    // GC: 만료된 IP 엔트리 정리 (다른 rate-limit Map과 동일 패턴)
    if (ogRateMap.size > 2000) {
      const cutoffOG = Date.now()
      for (const [k, v] of ogRateMap) {
        if (cutoffOG > v.resetAt) ogRateMap.delete(k)
      }
    }
  }

  const { id } = await params
  // UUID 검증 — 비 UUID id가 24h CDN 캐시를 오염시키는 DoS 방지
  if (!UUID_RE_OG.test(id)) {
    return new ImageResponse(fallbackImage, { width: 1200, height: 630, headers: { 'X-Robots-Tag': 'noindex' } })
  }
  const actor = await fetchActor(id)

  if (!actor) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0A0A0A',
            fontSize: 24,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'sans-serif',
            letterSpacing: '0.15em',
          }}
        >
          kd4.club
        </div>
      ),
      { width: 1200, height: 630, headers: { 'X-Robots-Tag': 'noindex' } }
    )
  }

  // 썸네일은 가로(1200×630)이므로 세로 대표사진 대신 가로사진 우선 (2026-07-01 대표 지시). 없으면 대표사진.
  const landscapeUrl = await pickLandscapeUrl(id)
  const photoUrl = landscapeUrl ?? getPhotoUrl(actor)
  const isLandscapeBg = !!landscapeUrl

  // 2026-07-08 발견: 가로사진 없는 배우는 세로사진을 1200×630에 cover로 욱여넣는데
  // 'center top' 고정값이 스케일 후 상단만 노출해 눈까지만 보이고 코·입·턱이 잘림
  // (설진수 제보). 흔한 인물사진 세로비(2:3~3:4)라면 어느 쪽이든 12~13%대로 수렴하므로
  // 고정 기본값(12%)을 우선 적용 — imageDims 네트워크 조회 성패에 기능이 좌우되지 않게 함.
  // 치수 조회가 성공하면(비정상적으로 긴 세로사진 등) 더 정확한 값으로 보정.
  let fallbackPositionY = 12
  if (photoUrl && !isLandscapeBg) {
    try {
      const d = await imageDims(photoUrl)
      if (d && d.h > d.w) {
        const scaledH = d.h * (1200 / d.w)
        const headroomFrac = 0.08 // 원본 상단 8% 지점을 프레임 상단에 (헤드룸 유지)
        const offset = headroomFrac * scaledH
        fallbackPositionY = Math.max(0, Math.min(100, (offset / (scaledH - 630)) * 100))
      }
    } catch (e) {
      console.warn('[OG] imageDims 실패 — 기본값(12%) 사용:', e instanceof Error ? e.message : e)
    }
  }
  // 썸네일 직관화 (2026-07-01 대표 지시): 연령대(30대) 대신 실제 만나이 + 키, 그리고 특기(사투리 포함)
  const currentYearOg = new Date().getFullYear()
  const ageLabel = actor.birth_year ? `${currentYearOg - actor.birth_year}세` : actor.age_group
  const subline = [ageLabel, actor.height ? `${actor.height}cm` : null]
    .filter(Boolean)
    .join(' · ')
  // 특기(사투리·무에타이 등) — 카드 가독성을 위해 최대 3개. 캐스팅 태그는 플래그 OFF면 미표시 유지.
  const skillLine = (actor.skills ?? []).slice(0, 3).join(' · ')
  const tags = SHOW_CASTING_TAGS ? (actor.casting_tags?.slice(0, 4) ?? []) : []

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#0A0A0A',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* 풀배경 사진 */}
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={actor.name}
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              // 얼굴이 잘리지 않게 상단(머리·얼굴) 기준 크롭 — 가로/세로 공통 (2026-07-01 대표 지시: 얼굴 잘 보이게)
              objectPosition: isLandscapeBg ? 'center 22%' : `center ${fallbackPositionY.toFixed(1)}%`,
            }}
          />
        )}

        {/* 콘텐츠 레이어 — 2026-07-08 대표 지시: 사진 전체 그라디언트 제거,
            글자 뒤 솔리드 패널로만 가독성 확보(사진은 원본 그대로 밝게 보임) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '44px 60px 48px',
          }}
        >
          {/* 하단: 이름 · 서브라인 · 태그 — 솔리드 다크 패널(그라디언트 아님) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: 'rgba(10,10,10,0.72)',
              borderRadius: 16,
              padding: '20px 26px',
            }}
          >
            {/* 캐스팅 태그 */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                {tags.map((t) => (
                  <div
                    key={t}
                    style={{
                      display: 'flex',
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#C9A84C',
                      background: 'rgba(201,168,76,0.15)',
                      border: '1px solid rgba(201,168,76,0.5)',
                      borderRadius: 4,
                      padding: '4px 12px',
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}

            {/* 배우 이름 */}
            <div
              style={{
                display: 'flex',
                fontSize: 96,
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.0,
                letterSpacing: '-0.01em',
              }}
            >
              {actor.name}
            </div>

            {/* 서브라인(실제 나이·키) + 도메인 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 4 }}>
              {subline && (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 26,
                    color: 'rgba(255,255,255,0.82)',
                    fontWeight: 600,
                  }}
                >
                  {subline}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.25)',
                  letterSpacing: '0.06em',
                  marginLeft: 'auto',
                }}
              >
                kd4.club
              </div>
            </div>

            {/* 특기(사투리·무에타이 등) — 골드 */}
            {skillLine && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 21,
                  color: '#D9BC6A',
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {skillLine}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'noindex',
      },
    }
  )
}
