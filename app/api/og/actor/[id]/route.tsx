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

export const runtime = 'edge'
export const revalidate = 3600 // 1h — 배우가 프로필 수정해도 최대 1시간 내 OG 이미지 갱신

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface ActorOg {
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  height: number | null
  drive_photo_id: string | null
  storage_photo_path: string | null
  profile_photo: string | null
  casting_tags: string[] | null
  casting_summary: string | null
}

async function fetchActor(id: string): Promise<ActorOg | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/actors?id=eq.${encodeURIComponent(id)}&is_public=eq.true&select=name,gender,age_group,height,drive_photo_id,storage_photo_path,profile_photo,casting_tags,casting_summary&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
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
    return `${SUPABASE_URL}/storage/v1/object/public/actor-photos/${actor.storage_photo_path}`
  }
  if (actor.drive_photo_id) {
    return `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w1200`
  }
  return null
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // UUID 검증 — 비 UUID id가 24h CDN 캐시를 오염시키는 DoS 방지
  if (!UUID_RE_OG.test(id)) {
    return new ImageResponse(fallbackImage, { width: 1200, height: 630 })
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
      { width: 1200, height: 630 }
    )
  }

  const photoUrl = getPhotoUrl(actor)
  const genderLabel =
    actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : '배우'
  const subline = [actor.age_group, genderLabel, actor.height ? `${actor.height}cm` : null]
    .filter(Boolean)
    .join(' · ')
  const tags = actor.casting_tags?.slice(0, 4) ?? []

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
              objectPosition: 'center top',
            }}
          />
        )}

        {/* 다크 그라디언트 오버레이 (하단 강조) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 100%)',
            display: 'flex',
          }}
        />

        {/* 콘텐츠 레이어 */}
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
          {/* 하단: 이름 · 서브라인 · 태그 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

            {/* 서브라인 + 도메인 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 4 }}>
              {subline && (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 22,
                    color: 'rgba(255,255,255,0.75)',
                    fontWeight: 500,
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
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
