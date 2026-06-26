'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFavorites } from '@/lib/useFavorites'
import { useUserRole } from '@/lib/useUserRole'
import { SHOW_CASTING_TAGS } from '@/lib/access'
import { getActorPhotoUrl, shouldOptimize } from '@/lib/actor-photo'
import ActorCardImage from '@/components/actors/ActorCardImage'
import FavoriteButton from '@/components/actors/FavoriteButton'

interface Actor {
  id: string
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  casting_tags: string[] | null
  profile_photo: string | null
  storage_photo_path: string | null
  photoSrc: string
  unoptimized: boolean
}

export default function ShortlistPage() {
  const { isDirector, loaded: roleLoaded } = useUserRole()
  const { favorites, loaded, clearFavorites } = useFavorites()
  const [actors, setActors] = useState<Actor[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) return
    if (favorites.length === 0) { setActors([]); return }

    setFetching(true)
    setError(null)

    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error: err } = await supabase
          .from('actors')
          .select('id, name, gender, age_group, casting_tags, profile_photo, storage_photo_path')
          .in('id', favorites)
          .eq('is_public', true)

        if (err) throw err
        const rows: Actor[] = (data ?? []).map((a) => ({
          ...a,
          photoSrc: getActorPhotoUrl(a),
          unoptimized: !shouldOptimize(a),
        }))
        // localStorage 순서 보존
        const order = new Map(favorites.map((id, i) => [id, i]))
        rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        setActors(rows)
      } catch (e) {
        setError('배우 정보를 불러오지 못했습니다.')
        console.error(e)
      } finally {
        setFetching(false)
      }
    })()
  }, [loaded, favorites])

  // 🔒 숏리스트는 캐스팅 디렉터/관리자 전용 (2026-06-17 대표 지시)
  if (!roleLoaded) {
    return (
      <main id="main-content" style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>불러오는 중...</p>
      </main>
    )
  }
  if (!isDirector) {
    return (
      <main id="main-content" style={{ maxWidth: 560, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: 16 }}>🔒</p>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--white)', marginBottom: 12 }}>
          캐스팅 디렉터 전용
        </h1>
        <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-sans)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 24 }}>
          숏리스트는 캐스팅 디렉터 회원만 이용할 수 있는 기능입니다.<br />
          디렉터 권한이 필요하면 마이페이지에서 신청해주세요.
        </p>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 24px', border: '1px solid var(--gold)', borderRadius: 4, color: 'var(--gold)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', textDecoration: 'none' }}>
          마이페이지로
        </Link>
      </main>
    )
  }

  return (
    <main id="main-content" style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '100px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--white)', margin: 0, letterSpacing: '-0.02em' }}>
            ♥ 숏리스트
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray)', margin: '6px 0 0' }}>
            배우 카드의 ♡ 버튼으로 추가 · 이 기기에만 저장됨
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {actors.length > 0 && (
            <button
              type="button"
              onClick={clearFavorites}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--gray)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              전체 삭제
            </button>
          )}
          <Link
            href="/actors"
            style={{
              padding: '8px 16px',
              background: 'var(--navy)',
              border: '1px solid var(--navy)',
              borderRadius: 6,
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            배우 DB 보기
          </Link>
        </div>
      </div>

      {!loaded || fetching ? (
        <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>불러오는 중...</p>
      ) : error ? (
        <p style={{ color: '#c73e3e', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>{error}</p>
      ) : actors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: '2rem', marginBottom: 16 }}>♡</p>
          <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-sans)', fontSize: '0.95rem', marginBottom: 24 }}>
            아직 추가된 배우가 없습니다.<br />배우 DB에서 ♡ 버튼을 눌러 추가해보세요.
          </p>
          <Link
            href="/actors"
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '10px 24px',
              border: '1px solid var(--gold)', borderRadius: 4,
              color: 'var(--gold)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            배우 DB로 이동
          </Link>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 20, fontFamily: 'var(--font-sans)' }}>
            {actors.length}명 저장됨
          </p>
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
            aria-label="숏리스트 배우 목록"
          >
            {actors.map((actor, idx) => (
              <li
                key={actor.id}
                style={{
                  display: 'block',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  aspectRatio: '3/2',
                  position: 'relative',
                  background: 'var(--bg3)',
                }}
              >
                <Link
                  href={`/actors/${actor.id}`}
                  style={{ display: 'block', position: 'absolute', inset: 0, textDecoration: 'none' }}
                  aria-label={`${actor.name} 배우 프로필 보기`}
                >
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <ActorCardImage
                      src={actor.photoSrc}
                      alt={actor.name}
                      unoptimized={actor.unoptimized}
                      priority={idx < 2}
                    />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                      padding: '28px 12px 10px',
                    }}>
                      <h2 style={{
                        margin: 0, padding: 0,
                        fontFamily: 'var(--font-display), Oswald, sans-serif',
                        fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '0.04em',
                        lineHeight: 1.2,
                      }}>
                        {actor.name}
                      </h2>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-sans)' }}>
                        {actor.gender ?? ''}{actor.gender && actor.age_group ? ' · ' : ''}{actor.age_group ?? ''}
                      </span>
                      {SHOW_CASTING_TAGS && actor.casting_tags && actor.casting_tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {actor.casting_tags.slice(0, 3).map((t) => (
                            <span key={t} style={{
                              padding: '2px 7px',
                              background: 'rgba(255,255,255,0.15)',
                              borderRadius: 99,
                              fontSize: '0.65rem',
                              color: 'rgba(255,255,255,0.9)',
                              fontFamily: 'var(--font-sans)',
                              letterSpacing: '0.03em',
                            }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                <FavoriteButton actorId={actor.id} actorName={actor.name} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
