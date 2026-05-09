/**
 * 동적 OG 이미지 — 배우 캐스팅 카드 자동 생성
 *
 * 카카오톡·페이스북·트위터에서 https://kd4.club/actors/{id} 링크 공유 시
 * 이 라우트가 1200×630 PNG 캐스팅 카드를 생성해 미리보기로 표시.
 *
 * 사용:
 *   <meta property="og:image" content="https://kd4.club/api/og/actor/{id}" />
 *
 * 캐싱: Vercel Edge CDN 24시간 (배우 데이터 변경 시 자동 무효화 안 됨 —
 *      필요 시 ?v={timestamp} 쿼리로 강제 무효화)
 */

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const revalidate = 86400 // 24h

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
    `${SUPABASE_URL}/rest/v1/actors?id=eq.${id}&select=name,gender,age_group,height,drive_photo_id,storage_photo_path,profile_photo,casting_tags,casting_summary&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      next: { revalidate: 3600 },
    }
  )
  if (!res.ok) return null
  const rows = (await res.json()) as ActorOg[]
  return rows[0] ?? null
}

function getPhotoUrl(actor: ActorOg): string | null {
  if (actor.profile_photo) return actor.profile_photo
  if (actor.storage_photo_path && SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/actor-photos/${actor.storage_photo_path}`
  }
  if (actor.drive_photo_id) {
    return `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w900`
  }
  return null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
            background: '#F0F0E8',
            fontSize: 60,
            color: '#15488A',
            fontFamily: 'sans-serif',
          }}
        >
          KD4 ACTING STUDIO
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
          background: '#F0F0E8',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 좌측: 배우 사진 (정사각 480) */}
        <div
          style={{
            width: 480,
            height: 630,
            background: '#E8E8DF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={actor.name}
              width={480}
              height={630}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
            />
          ) : (
            <div style={{ fontSize: 80, color: '#B8B8AC' }}>📷</div>
          )}
        </div>

        {/* 우측: 텍스트 영역 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '64px 56px 48px',
            justifyContent: 'space-between',
            background: '#F0F0E8',
          }}
        >
          {/* 상단: KD4 로고 영역 + 캐스팅 라벨 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 18,
                letterSpacing: '0.3em',
                color: '#15488A',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              KD4 ACTING STUDIO
            </div>
            <div
              style={{
                display: 'flex',
                width: 60,
                height: 2,
                background: '#15488A',
                marginTop: 8,
              }}
            />
          </div>

          {/* 중앙: 이름·서브라인·태그·요약 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 88,
                fontWeight: 800,
                color: '#111111',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}
            >
              {actor.name}
            </div>
            {subline && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 24,
                  color: '#4A4A4A',
                  fontWeight: 500,
                }}
              >
                {subline}
              </div>
            )}

            {/* 캐스팅 태그 */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {tags.map((t) => (
                  <div
                    key={t}
                    style={{
                      display: 'flex',
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#15488A',
                      background: 'rgba(21,72,138,0.1)',
                      border: '1px solid rgba(21,72,138,0.3)',
                      borderRadius: 4,
                      padding: '6px 14px',
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}

            {/* 캐스팅 요약 */}
            {actor.casting_summary && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 22,
                  color: '#15488A',
                  fontWeight: 600,
                  lineHeight: 1.5,
                  marginTop: 16,
                  paddingLeft: 14,
                  borderLeft: '3px solid #15488A',
                }}
              >
                {actor.casting_summary}
              </div>
            )}
          </div>

          {/* 하단: kd4.club */}
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              color: '#6B6660',
              letterSpacing: '0.05em',
            }}
          >
            kd4.club / actors
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}
