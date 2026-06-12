'use client'

/**
 * 배우 자료 다운로드 버튼 — [프로필 다운로드] / [영상 다운로드] 2개 분리 (2026-06-12).
 * - 디렉터/관리자: 프로필·영상 각각 따로 다운로드 (있는 자료만 버튼 노출).
 * - 영상은 순차 다운로드 (500ms 간격 — 다중 다운로드 차단 방지).
 * - locked 모드(2026-06-12 부분공개 정책): 비권한자에게도 버튼은 노출하되
 *   클릭 시 회원가입('guest') 또는 디렉터 신청('member') 안내 모달 표시.
 */

import { useState } from 'react'
import SignupPromptModal from '@/components/actors/SignupPromptModal'

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export default function ActorDownloadButton({
  profileUrl,
  videoIds,
  locked = null,
  nextUrl = '/actors',
}: {
  profileUrl?: string | null
  videoIds: string[]
  /** 'guest': 비로그인 → 회원가입 안내 / 'member': 로그인 비디렉터 → 디렉터 신청 안내 */
  locked?: 'guest' | 'member' | null
  /** locked 모드에서 가입·로그인 후 돌아올 경로 */
  nextUrl?: string
}) {
  const [profileLoading, setProfileLoading] = useState(false)
  const [videosLoading, setVideosLoading] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)

  function trigger(url: string) {
    const a = document.createElement('a')
    a.href = url
    a.rel = 'noopener'
    // same-origin(프로필 프록시)에서는 강제 다운로드, cross-origin(영상 presigned)에서는
    // 무시되고 서버의 Content-Disposition 헤더가 다운로드를 처리한다.
    a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function downloadProfile() {
    if (!profileUrl) return
    setProfileLoading(true)
    try {
      trigger(profileUrl)
      await new Promise((r) => setTimeout(r, 500))
    } finally {
      setProfileLoading(false)
    }
  }

  async function downloadVideos() {
    setVideosLoading(true)
    try {
      for (const [index, id] of videoIds.entries()) {
        try {
          // idx(1-base): 서버가 "{나이대} {성별} {이름} 출연영상{idx}" 파일명 생성에 사용
          const res = await fetch(`/api/videos/${id}/signed-url?download=1&idx=${index + 1}`, { signal: AbortSignal.timeout(10_000) })
          const j = await res.json()
          if (res.ok && j.url) {
            trigger(j.url)
            await new Promise((r) => setTimeout(r, 500)) // 다중 다운로드 차단 방지 간격
          }
        } catch {
          /* 개별 실패는 건너뜀 */
        }
      }
    } finally {
      setVideosLoading(false)
    }
  }

  // locked 모드: 클릭 시 안내 모달 (실제 다운로드 URL 없음)
  if (locked) {
    return (
      <>
        <button type="button" onClick={() => setPromptOpen(true)} style={{ ...styles.btn, width: '100%' }}>
          <DownloadIcon />
          자료 다운로드 (프로필·영상) <span aria-hidden="true">🔒</span>
        </button>
        <SignupPromptModal
          open={promptOpen}
          onClose={() => setPromptOpen(false)}
          variant={locked === 'guest' ? 'signup' : 'director'}
          message={locked === 'guest'
            ? '프로필·영상 자료 다운로드는 KD4 회원 중 캐스팅 디렉터 전용입니다. 먼저 무료 회원가입을 진행해 주세요.'
            : '자료 다운로드는 승인된 캐스팅 디렉터/관리자 전용입니다. 마이페이지에서 디렉터 권한을 신청해 주세요.'}
          nextUrl={nextUrl}
        />
      </>
    )
  }

  const hasProfile = !!profileUrl
  const hasVideos = videoIds.length > 0
  if (!hasProfile && !hasVideos) return null

  const anyLoading = profileLoading || videosLoading

  return (
    <>
      <div style={styles.row}>
        {hasProfile && (
          <button type="button" onClick={downloadProfile} disabled={profileLoading} aria-busy={profileLoading} style={styles.btn}>
            <DownloadIcon />
            {profileLoading ? '다운로드 중...' : '프로필 다운로드'}
          </button>
        )}
        {hasVideos && (
          <button type="button" onClick={downloadVideos} disabled={videosLoading} aria-busy={videosLoading} style={styles.btn}>
            <DownloadIcon />
            {videosLoading ? '다운로드 중...' : '영상 다운로드'}
          </button>
        )}
      </div>
      <span role="status" aria-live="polite" className="sr-only">{anyLoading ? '자료를 다운로드하는 중입니다.' : ''}</span>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    gap: 8,
    width: '100%',
    flexWrap: 'wrap',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--gold)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 16px',
    minHeight: 44,
    fontSize: '0.9rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    flex: '1 1 140px',
  },
}
