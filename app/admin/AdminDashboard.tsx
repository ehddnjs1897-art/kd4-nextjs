'use client'

import { useState, useEffect } from 'react'
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

const ROLE_CYCLE: Record<string, string> = {
  user: 'crew',
  crew_pending: 'crew',
  crew: 'editor',
  editor: 'admin',
  admin: 'user',
}
const ROLE_LABEL: Record<string, string> = {
  user: '일반회원',
  crew_pending: '크루 신청 대기',
  crew: 'KD4 크루',
  editor: '편집자',
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
      setApprovedMsg(`✓ ${approved} 님이 KD4 크루로 승인되었습니다.`)
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

  // ── 회원 역할 변경 ──
  async function handleRoleChange(profileId: string, currentRole: string) {
    const newRole = ROLE_CYCLE[currentRole] ?? 'user'
    setLoadingId(profileId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profileId, role: newRole }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        alert(`역할 변경 실패: ${error}`)
        return
      }
      setLocalProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      )
    } catch {
      alert('역할 변경 중 오류가 발생했습니다.')
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
      })
      if (!res.ok) {
        const { error } = await res.json()
        alert(`공개 설정 변경 실패: ${error}`)
        return
      }
      setLocalActors((prev) =>
        prev.map((a) => (a.id === actorId ? { ...a, is_public: !current } : a))
      )
    } catch {
      alert('공개 설정 변경 중 오류가 발생했습니다.')
    } finally {
      setLoadingId(null)
    }
  }

  // ── 게시글 삭제 ──
  async function handleDeletePost(postId: string) {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return
    setLoadingId(postId)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '알 수 없는 오류' }))
        alert(`삭제 실패: ${error}`)
        return
      }
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch {
      alert('게시글 삭제 중 오류가 발생했습니다.')
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
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '알 수 없는 오류' }))
        alert(`상태 변경 실패: ${error}`)
        return
      }
      setLocalApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      )
    } catch {
      alert('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div style={s.page}>
      <div className="container">
        {/* 헤더 */}
        <div style={s.header}>
          <p style={s.eyebrow}>ADMIN</p>
          <h1 style={s.pageTitle}>관리자 대시보드</h1>
        </div>

        {/* 승인 완료 알림 */}
        {approvedMsg && (
          <div style={{
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
          }}>
            <span>{approvedMsg}</span>
            <button onClick={() => setApprovedMsg(null)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
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
        <div style={s.tabBar}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={activeTab === key ? { ...s.tab, ...s.tabActive } : s.tab}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        {/* ── 회원 관리 ── */}
        {activeTab === 'users' && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>회원 목록 ({localProfiles.length}명)</h2>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['이름', '이메일', '역할', '가입일', '배우 연결', '역할 변경'].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
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
                      <td style={s.td}>{formatDate(p.created_at)}</td>
                      <td style={s.td}>
                        <span style={p.actor_id ? s.yes : s.no}>
                          {p.actor_id ? '연결됨' : '없음'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button
                          onClick={() => handleRoleChange(p.id, p.role)}
                          disabled={loadingId === p.id}
                          style={p.role === 'crew_pending'
                            ? { ...s.actionBtn, borderColor: 'rgba(74,158,255,0.5)', color: '#7ab8ff' }
                            : s.actionBtn}
                        >
                          {loadingId === p.id
                            ? '...'
                            : p.role === 'crew_pending'
                            ? '✓ 크루 승인'
                            : `→ ${ROLE_LABEL[ROLE_CYCLE[p.role] ?? 'user']}`}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── 배우 목록 ── */}
        {activeTab === 'actors' && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>배우 목록 ({localActors.length}명)</h2>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['이름', '성별', '연령대', '공개 여부', '공개 토글'].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
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
                          onClick={() => handleActorToggle(a.id, a.is_public)}
                          disabled={loadingId === a.id}
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
        )}

        {/* ── 게시판 관리 ── */}
        {activeTab === 'posts' && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>최근 게시글 ({localPosts.length}개)</h2>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['제목', '작성자', '카테고리', '작성일', '삭제'].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
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
                        <td style={s.td}>{formatDate(p.created_at)}</td>
                        <td style={s.td}>
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            disabled={loadingId === p.id}
                            style={s.actionBtnDanger}
                          >
                            {loadingId === p.id ? '...' : '삭제'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── 수강신청 목록 ── */}
        {activeTab === 'applications' && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>수강신청 목록 ({localApplications.length}건)</h2>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['이름', '이메일', '연락처', '클래스', '상태', '신청일', '상태 변경'].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
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
                        <td style={s.td}>{formatDate(app.created_at)}</td>
                        <td style={s.td}>
                          <button
                            onClick={() => handleStatusChange(app.id, app.status)}
                            disabled={loadingId === app.id}
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
        )}
      </div>
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={s.statCard}>
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
    padding: '5px 12px',
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
    padding: '5px 12px',
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
