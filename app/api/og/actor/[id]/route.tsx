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

/** 썸네일(가로 1200×630)용 — 배우 포트폴리오 사진 중 '가로' 첫 장의 URL+실측 치수. 없으면 null → 대표사진 폴백. */
async function pickLandscapeUrl(id: string): Promise<{ url: string; w: number; h: number } | null> {
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
      if (d && d.w > d.h * 1.05) return { url: u, w: d.w, h: d.h }
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
  const landscapePick = await pickLandscapeUrl(id)
  const photoUrl = landscapePick?.url ?? getPhotoUrl(actor)
  const isLandscapeBg = !!landscapePick

  // 2026-07-08 발견: objectFit/objectPosition 퍼센트 지정을 3차례 다르게 바꿔 배포해도
  // 픽셀 단위로 동일한 결과가 나와(설진수 제보) Satori가 값을 무시하는 것으로 의심했으나,
  // width/height/top/left 픽셀 배치로 바꿔 실측 crop과 1:1로 대조해보니 Satori는 정상
  // 렌더링 중이었음 — 진짜 원인은 헤드룸 기준값(스케일 후 전체 높이의 8%)이 너무 작았던
  // 것. 세로 원본(2:3~3:4)을 1200×630(1.9:1)에 우겨넣으면 실제로 보이는 영역이 원본의
  // 30~35%뿐이라, 상단에서 8%만 내려가면 어차피 코 언저리에서 끝남 — 3차례 시도 모두
  // 비슷한 작은 값(8~12%)이라 결과가 겹쳐 보였을 뿐, Satori 문제가 아니었음.
  // → 기준을 '스케일 후 전체 높이의 %'가 아니라 '실제로 잘려나가는 초과분(overflow)의 %'로
  // 변경 — 원본 사진으로 직접 검증(설진수 2:3 강한크롭, 박우진 1.5:1 약한크롭 둘 다 확인):
  // 초과분의 30% 지점에서 시작하면 이마~눈~코~입~턱까지 자연스럽게 프레임에 들어옴.
  let photoW = 900
  let photoH = 1200 // 실측 실패 시 기본 가정: 3:4 세로비
  if (isLandscapeBg && landscapePick) {
    photoW = landscapePick.w
    photoH = landscapePick.h
  } else if (photoUrl) {
    try {
      const d = await imageDims(photoUrl)
      if (d) { photoW = d.w; photoH = d.h }
    } catch (e) {
      console.warn('[OG] imageDims 실패 — 기본 세로비(3:4) 가정 사용:', e instanceof Error ? e.message : e)
    }
  }
  // 1200×630 프레임을 채우는 스케일(cover) — 가로/세로 어느 쪽이 넘치든 동일 계산
  const coverScale = Math.max(1200 / photoW, 630 / photoH)
  const scaledW = Math.round(photoW * coverScale)
  const scaledH = Math.round(photoH * coverScale)
  const TOP_OVERFLOW_FRAC = 0.3 // 잘려나가는 세로 초과분 중 상단 30%를 프레임 위로 넘김
  const photoTopOffset = scaledH > 630 ? Math.round(TOP_OVERFLOW_FRAC * (scaledH - 630)) : 0
  const photoLeftOffset = scaledW > 1200 ? Math.round((scaledW - 1200) / 2) : 0
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
        {/* 풀배경 사진 — object-fit/object-position 대신 실측 스케일 픽셀 크기 + top/left
            음수 오프셋으로 직접 배치 (Satori의 object-position Y값 미반영 문제 우회) */}
        {photoUrl && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, overflow: 'hidden', display: 'flex' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={actor.name}
              width={scaledW}
              height={scaledH}
              style={{
                position: 'absolute',
                top: -photoTopOffset,
                left: -photoLeftOffset,
                width: scaledW,
                height: scaledH,
              }}
            />
          </div>
        )}

        {/* 콘텐츠 레이어 — 2026-07-08 대표 지시: 박스·패널·그라디언트 전부 금지, 인물 사진과
            텍스트만 나오게. 배경 요소 없이 텍스트 자체에 그림자만 줘서 가독성 확보 (다시 박스 넣지 말 것). */}
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
          {/* 이름만 노출 — 나이·키·특기·태그·도메인 등 부가 텍스트 전부 제거 (2026-07-08 대표 지시) */}
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.0,
              letterSpacing: '-0.01em',
              textShadow: '0 2px 10px rgba(0,0,0,0.85), 0 4px 24px rgba(0,0,0,0.6)',
            }}
          >
            {actor.name}
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
