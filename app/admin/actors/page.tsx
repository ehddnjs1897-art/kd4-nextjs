/**
 * /admin/actors — 배우 프로필 관리 (관리자 전용)
 *
 * - 전체 배우 목록 + 각 배우의 사진/영상/필모/PPTX 현황
 * - 공개/비공개 토글
 * - 50명 배우 가입 후 관리자가 검토하는 메인 페이지
 */
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import ActorManagementTable, { ActorRow } from './ActorManagementTable'

export const metadata: Metadata = {
  title: '배우 관리 (관리자)',
  description: 'KD4 배우 관리 (관리자 전용)',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminActorsPage() {
  // auth/role은 app/admin/layout.tsx에서 처리

  // ── 데이터 fetch (Opus 설계: 4쿼리 병렬, actor_id별 집계) ──────────────────
  const [actorsRes, photosRes, videosRes, filmRes, profilesRes] = await Promise.all([
    supabaseAdmin
      .from('actors')
      .select('id, name, is_public, profile_doc_path, age_group, gender')
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('actor_photos')
      .select('actor_id'),
    supabaseAdmin
      .from('actor_videos')
      .select('actor_id'),
    supabaseAdmin
      .from('actor_filmography')
      .select('actor_id'),
    supabaseAdmin
      .from('profiles')
      .select('actor_id, id')
      .not('actor_id', 'is', null),
  ])

  const actors = actorsRes.data ?? []
  const photos = photosRes.data ?? []
  const videos = videosRes.data ?? []
  const films = filmRes.data ?? []
  const profiles = profilesRes.data ?? []

  // actor_id별 카운트 맵
  const photoCount = new Map<string, number>()
  const videoCount = new Map<string, number>()
  const filmCount = new Map<string, number>()
  const profileMap = new Map<string, string>() // actor_id → user_id

  photos.forEach(p => photoCount.set(p.actor_id, (photoCount.get(p.actor_id) ?? 0) + 1))
  videos.forEach(v => videoCount.set(v.actor_id, (videoCount.get(v.actor_id) ?? 0) + 1))
  films.forEach(f => filmCount.set(f.actor_id, (filmCount.get(f.actor_id) ?? 0) + 1))
  profiles.forEach(p => p.actor_id && profileMap.set(p.actor_id, p.id))

  const rows: ActorRow[] = actors.map(a => ({
    id: a.id,
    name: a.name,
    is_public: a.is_public ?? false,
    profile_doc_path: a.profile_doc_path ?? null,
    age_group: a.age_group ?? null,
    gender: a.gender ?? null,
    photoCount: photoCount.get(a.id) ?? 0,
    videoCount: videoCount.get(a.id) ?? 0,
    filmCount: filmCount.get(a.id) ?? 0,
    profileUserId: profileMap.get(a.id) ?? null,
  }))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.35em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
              ADMIN
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--white)' }}>
              배우 프로필 관리
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray)', marginTop: 6 }}>
              자료를 업로드한 배우를 검토하고 공개 여부를 설정하세요.
            </p>
          </div>
          <Link href="/admin" style={{
            padding: '8px 16px', borderRadius: 6, fontSize: '0.82rem',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--gray)', textDecoration: 'none',
          }}>
            ← 관리자 홈
          </Link>
        </div>

        {/* 테이블 */}
        <ActorManagementTable actors={rows} />

      </div>
    </div>
  )
}
