import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CLASSES } from '@/lib/classes'
import EnrollForm from '@/components/enroll/EnrollForm'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: '클래스 신청',
  description: 'KD4 멤버 전용 클래스 수강 신청 페이지 — 기수·클래스를 선택하고 신청해 주세요.',
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/enroll`,
    title: '클래스 신청 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 클래스 수강 신청',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '클래스 신청 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 클래스 수강 신청',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

export const dynamic = 'force-dynamic'

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; select?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  /* ── 비로그인: 로그인 안내 ── */
  if (!user) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 64 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(64px,12vw,120px) 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.25em', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: 16 }}>
            <span lang="en">CLASS ENROLLMENT</span>
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 700, color: '#111', marginBottom: 14 }}>
            클래스 신청
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, marginBottom: 28 }}>
            클래스 신청은 로그인 후 이용하실 수 있어요.<br />
            처음이시면 회원가입 후 신청해 주세요.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/login?next=/enroll" className="btn-primary" style={{ background: 'var(--navy)', color: '#fff' }}>
              로그인
            </Link>
            <Link href="/auth/signup" className="btn-outline" style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}>
              회원가입
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── 로그인: 프로필 + 신청 가능 클래스 ── */
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, phone, email')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) {
    console.error('[EnrollPage] 프로필 조회 오류:', profileError)
  }

  // 전체 클래스 표시 · 수강료는 정가(originalPrice) 기준 — 첫 달 할인가가 아님
  const allClasses = CLASSES.map((c) => ({
    nameKo: c.nameKo,
    nameEn: c.nameEn,
    step: c.step,
    price: c.originalPrice ?? c.price,
    course: c.course ?? null,
    capacity: c.capacity,
    isNewMemberOpen: c.isNewMemberOpen ?? false,
    remainingSeats: c.remainingSeats,
    schedule: c.schedule,
    duration: c.duration,
    highlight: c.highlight ?? false,
  }))

  return (
    <>
      <PageJsonLd schemas={[buildBreadcrumb([
        { name: '홈', url: SITE_URL },
        { name: '클래스 신청', url: `${SITE_URL}/enroll` },
      ])]} />
      <EnrollForm
        classes={allClasses}
        userName={profile?.name ?? (user.user_metadata?.name as string) ?? ''}
        userPhone={profile?.phone ?? ''}
        userEmail={user.email ?? ''}
        initialType={params.type ?? '신규 등록'}
        initialSelect={params.select ? [params.select] : []}
      />
    </>
  )
}
