'use client'

import { useState, useEffect, useRef } from 'react'
import type {
  AdminProfile,
  AdminActor,
  AdminPost,
  AdminApplication,
} from './page'

// ─── 탭 ──────────────────────────────────────────────────────────────────────

type Tab = 'users' | 'actors' | 'posts' | 'applications'

const TAB_LABELS: Record<Tab, string> = {
  users: '회원 관리',
  actors: '배우 목록',
  posts: '게시판 관리',
  applications: '수강신청',
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 자가등록 배우가 승인(공개) 없이 며칠째 방치됐는지 — 승인대기 배너 정렬·경고색 기준
// (2026-07-10: 관리자 화면에 이 상태를 보여줄 곳이 아예 없어 최대 28일간 9명이 묻혀있던 것 발견 후 신설)
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

const ROLE_CYCLE: Record<string, string> = {
  user: 'crew',
  crew_pending: 'crew',
  crew: 'editor',
  editor: 'admin',
  admin: 'user',
  member: 'crew',
  actor: 'crew',
  director_pending: 'director',
  director: 'user',
}
const ROLE_LABEL: Record<string, string> = {
  user: '일반회원',
  crew_pending: '크루 신청 대기',
  crew: 'KD4 크루',
  member: '배우 멤버',
  actor: '배우 멤버',
  editor: '편집자',
  director_pending: '디렉터 승인 대기',
  director: '디렉터',
  admin: '관리자',
}
const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  confirmed: '확인',
  completed: '완료',
}
const STATUS_CYCLE: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'completed',
  completed: 'pending',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'rgba(240,173,78,0.15)',
  confirmed: 'rgba(92,184,92,0.15)',
  completed: 'rgba(91,192,222,0.15)',
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

interface Props {
  profiles: AdminProfile[]
  actors: AdminActor[]
  posts: AdminPost[]
  applications: AdminApplication[]
}

export default function AdminDashboard({ profiles, actors, posts, applications }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [approvedMsg, setApprovedMsg] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const approved = params.get('approved')
    if (approved) {
      setApprovedMsg(`${approved} 님이 KD4 크루로 승인되었습니다.`)
      // URL 파라미터 정리
      window.history.replaceState({}, '', '/admin')
    }
  }, [])

  // 로컬 상태 (API 호출 후 낙관적 업데이트)
  const [localProfiles, setLocalProfiles] = useState(profiles)
  const [localActors, setLocalActors] = useState(actors)
  const [localPosts, setLocalPosts] = useState(posts)
  const [localApplications, setLocalApplications] = useState(applications)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmingDeletePostId, setConfirmingDeletePostId] = useState<string | null>(null)

  // 승인 대기 배우 — 본인이 자료 올렸는데 아직 비공개인 사람. 오래 기다린 순.
  const pendingActors = localActors
    .filter((a) => a.self_managed && !a.is_public)
    .sort((a, b) => new Date(a.intake_submitted_at ?? 0).getTime() - new Date(b.intake_submitted_at ?? 0).getTime())
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'error' | 'ok' } | null>(null)

  // 탭 활성화 시 tabpanel로 포커스 이동 (WCAG 2.1.1 / ARIA Authoring Practices)
  const tabFirstMount = useRef(true)
  useEffect(() => {
    if (tabFirstMount.current) { tabFirstMount.current = false; return }
    document.getElementById(`admin-panel-${activeTab}`)?.focus()
  }, [activeTab])

  function showToast(text: string, type: 'error' | 'ok' = 'error') {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  // ── 회원 역할 변경 ──
  async function handleRoleChange(profileId: string, currentRole: string) {
    const newRole = ROLE_CYCLE[currentRole] ?? 'user'
    setLoadingId(profileId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profileId, role: newRole }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        const { error } = await res.json()
        showToast(`역할 변경 실패: ${error}`)
        return
      }
      setLocalProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      )
    } catch {
      showToast('역할 변경 중 오류가 발생했습니다.')
    } finally {
      setLoadingId(null)
    }
  }

  // ── 배우 is_public 토글 ──
  async function handleActorToggle(actorId: string, current: boolean) {
    setLoadingId(actorId)
    try {
      const res = await fetch(`/api/admin/actors/${actorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !current }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        const { error } = await res.json()
        showToast(`공개 설정 변경 실패: ${error}`)
        return
      }
      setLocalActors((prev) =>
        prev.map((a) => (a.id === actorId ? { ...a, is_public: !current } : a))
      )
    } catch {
      showToast('공개 설정 변경 중 오류가 발생했습니다.')
    } finally {
      setLoadingId(null)
    }
  }

  // ── 게시글 삭제 ──
  async function handleDeletePost(postId: string) {
    if (confirmingDeletePostId !== postId) { setConfirmingDeletePostId(postId); return }
    setConfirmingDeletePostId(null)
    setLoadingId(postId)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '알 수 없는 오류' }))
        showToast(`삭제 실패: ${error}`)
        return
      }
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch {
      showToast('게시글 삭제 중 오류가 발생했습니다.')
    } finally {
      setLoadingId(null)
    }
  }

  // ── 수강신청 status 변경 ──
  async function handleStatusChange(appId: string, currentStatus: string) {
    const newStatus = STATUS_CYCLE[currentStatus] ?? 'pending'
    setLoadingId(appId)
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '알 수 없는 오류' }))
        showToast(`상태 변경 실패: ${error}`)
        return
      }
      setLocalApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      )
    } catch {
      showToast('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div style={s.page}>
      <div className="container">
        {/* 헤더 */}
        <div style={s.header}>
          <p style={s.eyebrow}><span lang="en">ADMIN</span></p>
          <h1 style={s.pageTitle}>관리자 대시보드</h1>
          <a
            href="/admin/sales"
            style={{
              display: 'inline-block', marginTop: 10, marginRight: 10, padding: '8px 16px', borderRadius: 8,
              background: '#15488A', color: '#fff', textDecoration: 'none',
              fontSize: '0.85rem', fontWeight: 700,
            }}
          >
            <span aria-hidden="true">💰</span> 매출/수강 대시보드 <span aria-hidden="true">→</span>
          </a>
          <a
            href="/admin/character-generator"
            style={{
              display: 'inline-block', marginTop: 10, padding: '8px 16px', borderRadius: 8,
              border: '1px solid #15488A', color: '#15488A', textDecoration: 'none',
              fontSize: '0.85rem', fontWeight: 700,
            }}
          >
            캐릭터셋 프로필 생성기 <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* 에러 토스트 — always mounted so AT registers the live region before first announcement */}
        <div
          role="alert"
          aria-atomic="true"
          style={toastMsg?.type === 'error' ? {
            padding: '12px 18px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            color: '#ef4444',
            fontSize: '0.85rem',
            marginBottom: 20,
          } : { position: 'absolute', width: 1, height: 1, padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}
        >
          {toastMsg?.type === 'error' ? toastMsg.text : ''}
        </div>

        {/* 성공 토스트 + 승인 완료 알림 — always mounted (polite live region) */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={toastMsg?.type === 'ok' ? {
            padding: '12px 18px',
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: 8,
            color: '#4ade80',
            fontSize: '0.85rem',
            marginBottom: 20,
          } : approvedMsg ? {
            padding: '12px 18px',
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: 8,
            color: '#4ade80',
            fontSize: '0.9rem',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          } : { position: 'absolute', width: 1, height: 1, padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}
        >
          {toastMsg?.type === 'ok' ? toastMsg.text : approvedMsg ? (
            <>
              <span>{approvedMsg}</span>
              <button type="button" onClick={() => setApprovedMsg(null)} aria-label="닫기" style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '1.1rem' }}><span aria-hidden="true">×</span></button>
            </>
          ) : ''}
        </div>

        {/* 승인 대기 배우 배너 — 본인이 자료 올렸는데 알려주는 화면이 없어 최대 28일 방치되던 것 발견(2026-07-10) 후 신설.
            0명이면 아예 렌더 안 함(빈 배너로 화면 잠식 방지). */}
        {pendingActors.length > 0 && (
          <div style={s.pendingBanner} role="region" aria-label="승인 대기 배우">
            <p style={s.pendingBannerTitle}>
              <span aria-hidden="true">🔔</span> 승인 대기 {pendingActors.length}명 — 본인이 자료를 올렸는데 아직 비공개예요
            </p>
            <ul role="list" style={s.pendingList}>
              {pendingActors.map((a) => {
                const days = a.intake_submitted_at ? daysSince(a.intake_submitted_at) : null
                return (
                  <li key={a.id} style={s.pendingItem}>
                    <span style={s.pendingName}>
                      {a.name}
                      {a.phone && <span style={s.pendingPhone}> · {a.phone}</span>}
                    </span>
                    <span style={days !== null && days >= 14 ? s.pendingDaysUrgent : s.pendingDays}>
                      {days !== null ? `${days}일째 대기` : '대기중'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleActorToggle(a.id, a.is_public)}
                      disabled={loadingId === a.id}
                      aria-busy={loadingId === a.id}
                      style={s.pendingApproveBtn}
                    >
                      {loadingId === a.id ? '처리 중…' : '공개하기'}
                    </button>
                    <a href={`/actors/${a.id}`} target="_blank" rel="noopener noreferrer" style={s.pendingPreviewLink}>
                      미리보기
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* 통계 카드 */}
        <div style={s.statsRow}>
          <StatCard label="총 회원" value={localProfiles.length} />
          <StatCard label="배우 프로필" value={localActors.length} />
          <StatCard
            label="공개 배우"
            value={localActors.filter((a) => a.is_public).length}
          />
          <StatCard label="수강신청" value={localApplications.length} />
        </div>

        {/* 탭 네비게이션 */}
        <div
          style={s.tabBar}
          role="tablist"
          aria-label="관리자 메뉴"
          onKeyDown={e => {
            const keys = Object.keys(TAB_LABELS) as Tab[]
            const idx = keys.indexOf(activeTab)
            if (e.key === 'ArrowRight') { e.preventDefault(); setActiveTab(keys[(idx + 1) % keys.length]) }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); setActiveTab(keys[(idx - 1 + keys.length) % keys.length]) }
          }}
        >
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              type="button"
              key={key}
              role="tab"
              id={`admin-tab-${key}`}
              aria-selected={activeTab === key}
              aria-controls={`admin-panel-${key}`}
              tabIndex={activeTab === key ? 0 : -1}
              onClick={() => setActiveTab(key)}
              style={activeTab === key ? { ...s.tab, ...s.tabActive } : s.tab}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        {/* ── 회원 관리 ── */}
        <section style={s.section} role="tabpanel" id="admin-panel-users" aria-labelledby="admin-tab-users" hidden={activeTab !== 'users'}>
            <h2 style={s.sectionTitle}>회원 목록 ({localProfiles.length}명)</h2>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <caption className="sr-only">회원 목록</caption>
                <thead>
                  <tr>
                    {['이름', '이메일', '역할', '가입일', '배우 연결', '역할 변경'].map((h) => (
                      <th key={h} scope="col" style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localProfiles.map((p) => (
                    <tr key={p.id} style={s.tr}>
                      <td style={s.td}>{p.name || '—'}</td>
                      <td style={s.td}>{p.email || '—'}</td>
                      <td style={s.td}>
                        <span style={roleBadgeStyle(p.role)}>
                          {ROLE_LABEL[p.role] ?? p.role}
                        </span>
                      </td>
                      <td style={s.td}><time dateTime={p.created_at}>{formatDate(p.created_at)}</time></td>
                      <td style={s.td}>
                        <span style={p.actor_id ? s.yes : s.no}>
                          {p.actor_id ? '연결됨' : '없음'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button
                          type="button"
                          onClick={() => handleRoleChange(p.id, p.role)}
                          disabled={loadingId === p.id}
                          aria-busy={loadingId === p.id}
                          aria-label={
                            loadingId === p.id ? '처리 중'
                            : p.role === 'crew_pending' ? `${p.name || p.email || '회원'} 크루 승인`
                            : p.role === 'director_pending' ? `${p.name || p.email || '회원'} 디렉터 승인`
                            : `${p.name || p.email || '회원'} 역할 변경: ${ROLE_LABEL[ROLE_CYCLE[p.role] ?? 'user']}`
                          }
                          style={
                            p.role === 'crew_pending'
                              ? { ...s.actionBtn, borderColor: 'rgba(74,158,255,0.5)', color: '#7ab8ff' }
                              : p.role === 'director_pending'
                              ? { ...s.actionBtn, borderColor: 'rgba(196,165,90,0.5)', color: 'var(--gold)' }
                              : s.actionBtn
                          }
                        >
                          {loadingId === p.id
                            ? '...'
                            : p.role === 'crew_pending'
                            ? <><span aria-hidden="true">✓</span> 크루 승인</>
                            : p.role === 'director_pending'
                            ? <><span aria-hidden="true">✓</span> 디렉터 승인</>
                            : `→ ${ROLE_LABEL[ROLE_CYCLE[p.role] ?? 'user']}`}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </section>

        {/* ── 배우 목록 ── */}
        <section style={s.section} role="tabpanel" id="admin-panel-actors" aria-labelledby="admin-tab-actors" hidden={activeTab !== 'actors'}>
            <h2 style={s.sectionTitle}>배우 목록 ({localActors.length}명)</h2>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <caption className="sr-only">배우 목록</caption>
                <thead>
                  <tr>
                    {['이름', '성별', '연령대', '공개 여부', '공개 토글'].map((h) => (
                      <th key={h} scope="col" style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localActors.map((a) => (
                    <tr key={a.id} style={s.tr}>
                      <td style={s.td}>{a.name}</td>
                      <td style={s.td}>{a.gender || '—'}</td>
                      <td style={s.td}>{a.age_group || '—'}</td>
                      <td style={s.td}>
                        <span style={a.is_public ? s.yes : s.no}>
                          {a.is_public ? '공개' : '비공개'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button
                          type="button"
                          onClick={() => handleActorToggle(a.id, a.is_public)}
                          disabled={loadingId === a.id}
                          aria-busy={loadingId === a.id}
                          aria-label={loadingId === a.id ? '처리 중' : `${a.name} ${a.is_public ? '비공개로 전환' : '공개로 전환'}`}
                          style={a.is_public ? s.actionBtnDanger : s.actionBtn}
                        >
                          {loadingId === a.id
                            ? '...'
                            : a.is_public
                            ? '비공개로'
                            : '공개로'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </section>

        {/* ── 게시판 관리 ── */}
        <section style={s.section} role="tabpanel" id="admin-panel-posts" aria-labelledby="admin-tab-posts" hidden={activeTab !== 'posts'}>
            <h2 style={s.sectionTitle}>최근 게시글 ({localPosts.length}개)</h2>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <caption className="sr-only">최근 게시글</caption>
                <thead>
                  <tr>
                    {['제목', '작성자', '카테고리', '작성일', '삭제'].map((h) => (
                      <th key={h} scope="col" style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...s.td, textAlign: 'center', color: 'var(--gray)' }}>
                        게시글이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    localPosts.map((p) => (
                      <tr key={p.id} style={s.tr}>
                        <td style={{ ...s.td, maxWidth: 280 }}>
                          <span style={s.ellipsis}>{p.title}</span>
                        </td>
                        <td style={s.td}>{p.author_name || '—'}</td>
                        <td style={s.td}>{p.category || '—'}</td>
                        <td style={s.td}><time dateTime={p.created_at}>{formatDate(p.created_at)}</time></td>
                        <td style={s.td}>
                          <div aria-live="polite">
                            {confirmingDeletePostId === p.id ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button type="button" onClick={() => setConfirmingDeletePostId(null)} aria-label={`${p.title} 삭제 취소`} style={{ ...s.actionBtn, fontSize: '0.72rem', padding: '4px 8px' }}>취소</button>
                                <button type="button" onClick={() => handleDeletePost(p.id)} disabled={loadingId === p.id} aria-busy={loadingId === p.id} aria-label={`${p.title} 삭제 확인`} style={{ ...s.actionBtnDanger, background: '#ef4444', color: '#fff' }}>확인</button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeletePost(p.id)}
                                disabled={loadingId === p.id}
                                aria-label={loadingId === p.id ? `${p.title} 삭제 처리 중` : `${p.title} 삭제`}
                                aria-busy={loadingId === p.id}
                                style={s.actionBtnDanger}
                              >
                                {loadingId === p.id ? '...' : '삭제'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </section>

        {/* ── 수강신청 목록 ── */}
        <section style={s.section} role="tabpanel" id="admin-panel-applications" aria-labelledby="admin-tab-applications" hidden={activeTab !== 'applications'}>
            <h2 style={s.sectionTitle}>수강신청 목록 ({localApplications.length}건)</h2>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <caption className="sr-only">수강신청 목록</caption>
                <thead>
                  <tr>
                    {['이름', '이메일', '연락처', '클래스', '상태', '신청일', '상태 변경'].map((h) => (
                      <th key={h} scope="col" style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localApplications.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ ...s.td, textAlign: 'center', color: 'var(--gray)' }}
                      >
                        수강신청 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    localApplications.map((app) => (
                      <tr key={app.id} style={s.tr}>
                        <td style={s.td}>{app.name}</td>
                        <td style={s.td}>{app.email}</td>
                        <td style={s.td}>{app.phone || '—'}</td>
                        <td style={s.td}>{app.class_name || '—'}</td>
                        <td style={s.td}>
                          <span
                            style={{
                              ...s.statusBadge,
                              background: STATUS_COLOR[app.status] ?? 'transparent',
                            }}
                          >
                            {STATUS_LABEL[app.status] ?? app.status}
                          </span>
                        </td>
                        <td style={s.td}><time dateTime={app.created_at}>{formatDate(app.created_at)}</time></td>
                        <td style={s.td}>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(app.id, app.status)}
                            disabled={loadingId === app.id}
                            aria-busy={loadingId === app.id}
                            aria-label={loadingId === app.id
                              ? '처리 중'
                              : `${app.name} 상태 변경: ${STATUS_LABEL[STATUS_CYCLE[app.status] ?? 'pending']}으로`}
                            style={s.actionBtn}
                          >
                            {loadingId === app.id
                              ? '...'
                              : `→ ${STATUS_LABEL[STATUS_CYCLE[app.status] ?? 'pending']}`}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </section>
      </div>
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={s.statCard} aria-label={`${label}: ${value}`}>
      <p style={s.statValue}>{value}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  )
}

// ─── 역할 뱃지 스타일 ────────────────────────────────────────────────────────

function roleBadgeStyle(role: string): React.CSSProperties {
  const configs: Record<string, { bg: string; border: string; color: string }> = {
    admin:        { bg: 'rgba(196,165,90,0.2)',  border: 'rgba(196,165,90,0.4)', color: 'var(--gold)' },
    editor:       { bg: 'rgba(92,184,92,0.15)',  border: 'rgba(92,184,92,0.3)',  color: '#7ed07e' },
    crew:         { bg: 'rgba(74,158,255,0.15)', border: 'rgba(74,158,255,0.3)', color: '#7ab8ff' },
    crew_pending: { bg: 'rgba(240,173,78,0.15)', border: 'rgba(240,173,78,0.4)', color: '#f0ad4e' },
    user:         { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.1)', color: 'var(--white)' },
  }
  const c = configs[role] ?? configs.user
  return {
    display: 'inline-block',
    padding: '2px 10px',
    background: c.bg,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    fontSize: '0.72rem',
    color: c.color,
    letterSpacing: '0.04em',
    fontWeight: role === 'crew_pending' ? 700 : 400,
  }
}

// ─── 스타일 ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: 88,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 32,
  },
  eyebrow: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: '0.7rem',
    fontWeight: 300,
    letterSpacing: '0.35em',
    color: 'var(--gold)',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
    fontWeight: 700,
    color: 'var(--white)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  statValue: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--gold)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    letterSpacing: '0.05em',
  },
  pendingBanner: {
    background: 'rgba(240,173,78,0.08)',
    border: '1px solid rgba(240,173,78,0.35)',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 24,
  },
  pendingBannerTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#f0ad4e',
    margin: '0 0 12px',
  },
  pendingList: {
    listStyle: 'none' as const,
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  pendingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
    padding: '8px 0',
    borderTop: '1px solid rgba(240,173,78,0.15)',
  },
  pendingName: {
    fontSize: '0.85rem',
    color: 'var(--white)',
    fontWeight: 600,
    minWidth: 140,
  },
  pendingPhone: {
    fontWeight: 400,
    color: 'var(--gray)',
  },
  pendingDays: {
    fontSize: '0.78rem',
    color: 'var(--gray)',
  },
  pendingDaysUrgent: {
    fontSize: '0.78rem',
    color: '#ef4444',
    fontWeight: 700,
  },
  pendingApproveBtn: {
    marginLeft: 'auto',
    padding: '6px 16px',
    minHeight: 36,
    background: '#f0ad4e',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  pendingPreviewLink: {
    fontSize: '0.78rem',
    color: 'var(--gold)',
    textDecoration: 'underline',
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid var(--border)',
    marginBottom: 28,
    overflowX: 'auto' as const,
  },
  tab: {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '10px 20px',
    minHeight: 44,
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'var(--gray)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    letterSpacing: '0.04em',
    transition: 'color 0.2s, border-color 0.2s',
    marginBottom: -1,
  },
  tabActive: {
    color: 'var(--gold)',
    borderBottomColor: 'var(--gold)',
  },
  section: {},
  sectionTitle: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--white)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    marginBottom: 16,
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.84rem',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--gray)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '12px 16px',
    color: 'var(--white)',
    verticalAlign: 'middle' as const,
  },
  yes: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(92,184,92,0.15)',
    border: '1px solid rgba(92,184,92,0.3)',
    borderRadius: 10,
    fontSize: '0.72rem',
    color: '#7ed07e',
  },
  no: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    fontSize: '0.72rem',
    color: 'var(--gray)',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    fontSize: '0.72rem',
    color: 'var(--white)',
  },
  actionBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '8px 14px',
    minHeight: 44,
    fontSize: '0.76rem',
    color: 'var(--white)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'border-color 0.2s',
  },
  actionBtnDanger: {
    background: 'transparent',
    border: '1px solid rgba(220,53,69,0.4)',
    borderRadius: 4,
    padding: '8px 14px',
    minHeight: 44,
    fontSize: '0.76rem',
    color: '#ff6b6b',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  ellipsis: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: 280,
  },
}
