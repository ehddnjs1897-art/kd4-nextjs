import { createHash, timingSafeEqual } from 'node:crypto'
import type { EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * 인증 링크 확인 페이지 — 문자/메일 속 재설정 링크가 도달하는 곳.
 *
 * 왜 버튼을 한 번 누르게 하나:
 * ① 토큰을 GET 렌더에서 소모하지 않으므로, 아이폰 문자 미리보기·메신저
 *    링크 프리뷰 봇이 링크를 미리 열어도 토큰이 살아 있음 (기존엔 이것 때문에
 *    사용자가 실제로 누르는 순간 이미 "만료" — 2026-07-23 배준 배우 사례)
 * ② verifyOtp(token_hash)는 링크를 요청한 브라우저가 아니어도 동작 — 문자앱·
 *    카톡 인앱 브라우저에서 열어도 세션이 정상 생성됨 (PKCE code 교환 방식은
 *    요청 브라우저에서만 성공해 "만료" 오탐을 유발했음)
 *
 * 두 가지 URL 형식:
 * - ?rt=<자체토큰>&u=<유저id> — 문자 재설정 (시간 만료 없음, 2026-07-23 대표 지시
 *   "재설정 링크 자체를 상시 열어둬". 사용 성공 시에만 소거되는 1회용).
 *   버튼을 누르는 순간 서버가 Supabase recovery 토큰을 즉석 발급·검증해 세션 생성.
 * - ?token_hash=...&type=recovery — Supabase 발급 토큰 직접 검증 (메일 템플릿·관리자 링크용)
 */

export const metadata = { title: '본인 확인 | KD4 액팅 스튜디오' }

const ALLOWED_TYPES: EmailOtpType[] = ['recovery', 'signup', 'magiclink', 'email_change', 'email']

async function verifyAction(formData: FormData) {
  'use server'

  const tokenHash = String(formData.get('token_hash') ?? '')
  const rt = String(formData.get('rt') ?? '')
  const uid = String(formData.get('u') ?? '')
  const typeRaw = String(formData.get('type') ?? 'recovery')
  const nextRaw = String(formData.get('next') ?? '')

  const type = (ALLOWED_TYPES as string[]).includes(typeRaw) ? (typeRaw as EmailOtpType) : 'recovery'
  // 오픈 리다이렉트 방지: 내부 경로만 허용
  const safeNext =
    nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.startsWith('/\\')
      ? nextRaw
      : '/auth/update-password'

  // ── 방식 1: 자체 상시 토큰 (문자 재설정) ──
  if (rt && uid) {
    // supabaseAdmin은 서버 전용 — 클라이언트 번들 유입 방지를 위해 액션 안에서 동적 로드
    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(uid)
    const stored = (userData?.user?.app_metadata as Record<string, unknown> | undefined)?.reset_token_hash
    if (userError || typeof stored !== 'string' || !userData?.user?.email) {
      redirect('/auth/update-password') // 세션 없음 → "링크가 만료되었습니다" 화면 재사용
    }

    const given = createHash('sha256').update(rt).digest()
    const expected = Buffer.from(stored, 'hex')
    const valid = given.length === expected.length && timingSafeEqual(given, expected)
    if (!valid) redirect('/auth/update-password')

    // 버튼을 누른 "지금" Supabase recovery 토큰을 발급해 즉시 검증 — 만료 창이 초 단위라
    // 문자 속 링크 자체는 시간 제한이 없다
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email,
    })
    const freshHash = linkData?.properties?.hashed_token
    if (linkError || !freshHash) redirect('/auth/update-password')

    const supabase = await createClient()
    const { error: otpError } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: freshHash })
    if (otpError) redirect('/auth/update-password')

    // 사용 성공 → 토큰 소거 (같은 문자로 두 번 비밀번호를 바꿀 수 없게 — 1회용)
    await supabaseAdmin.auth.admin.updateUserById(uid, {
      app_metadata: { reset_token_hash: null, reset_token_at: null },
    })
    redirect(safeNext)
  }

  // ── 방식 2: Supabase 토큰 직접 검증 (메일 템플릿·관리자 링크) ──
  if (!tokenHash) redirect('/auth/reset')

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  // 실패 시 /auth/update-password가 세션 없음을 감지해 "링크가 만료되었습니다"
  // 화면(재요청 버튼 포함)을 띄움 — 별도 오류 페이지 불필요
  redirect(error ? '/auth/update-password' : safeNext)
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string; rt?: string; u?: string }>
}) {
  const { token_hash = '', type = 'recovery', next = '', rt = '', u = '' } = await searchParams

  if (!token_hash && !(rt && u)) redirect('/auth/reset')

  const isRecovery = !ALLOWED_TYPES.includes(type as EmailOtpType) || type === 'recovery'

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <span style={styles.logoText}>KD4</span>
          <span lang="en" style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        <h1 style={styles.title}>{isRecovery ? '비밀번호 재설정' : '본인 확인'}</h1>
        <p style={styles.desc}>
          본인 확인을 위해 아래 버튼을 눌러 주세요.
          {isRecovery && (
            <>
              <br />새 비밀번호 설정 화면으로 이동합니다.
            </>
          )}
        </p>

        <form action={verifyAction}>
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="rt" value={rt} />
          <input type="hidden" name="u" value={u} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />
          <button type="submit" style={styles.btnPrimary}>
            {isRecovery ? '비밀번호 재설정 계속하기' : '확인하고 계속하기'}
          </button>
        </form>

        <p style={styles.hint}>
          본인이 요청하지 않았다면 이 페이지를 닫아 주세요.
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: 'clamp(28px, 6vw, 40px) clamp(18px, 6vw, 36px)',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 28,
    gap: 4,
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.1em',
  },
  logoSub: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.65rem',
    fontWeight: 300,
    letterSpacing: '0.35em',
    color: 'var(--gray)',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    fontWeight: 600,
    color: 'var(--white)',
    marginBottom: 16,
    textAlign: 'center',
  },
  desc: {
    fontSize: '0.9rem',
    color: 'var(--white)',
    lineHeight: 1.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '12px 0',
    minHeight: 44,
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    width: '100%',
  },
  hint: {
    fontSize: '0.78rem',
    color: 'var(--gray)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 1.6,
  },
}
