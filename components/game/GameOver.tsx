"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"

const STAGES = [
  "무명의 메모", "오디션 번호표", "엑스트라 콜시트", "단편의 사이드",
  "독립영화 러브콜", "첫 대사 한 줄", "콜백 통보", "크랭크인 소식",
  "안방극장의 얼굴", "첫 팬레터", "주연 캐스팅 확정", "천만 관객 티켓",
  "레드카펫 패스", "해외 배급 계약서", "영화제 초청장", "트로피 각인",
  "거장의 지명", "마스터클래스 초대", "전설의 크레딧", "OFF THE PLASTIC",
]

interface GameOverProps {
  score: number
  stageReached: number
  itemsCollected: number
  durationMs: number
  onRestart: () => void
}

export default function GameOver({
  score,
  stageReached,
  itemsCollected,
  durationMs,
  onRestart,
}: GameOverProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dialogRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  // 점수 저장 오류 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  // 포커스 트랩 + Escape 핸들러 (role=dialog aria-modal=true 접근성 요건)
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onRestart(); return }
      if (e.key === 'Tab') {
        const focusable = Array.from(
          el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onRestart])

  const stageName = STAGES[Math.min(stageReached - 1, STAGES.length - 1)]
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)

  const saveScore = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/game/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          score,
          duration_ms: durationMs,
          stage: stageReached,
          items_collected: itemsCollected,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "저장 실패")
      } else {
        setSaved(true)
      }
    } catch {
      setError("네트워크 오류")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="게임 오버"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2,2,2,0.92)",
        fontFamily: "var(--font-oswald), var(--font-noto-sans-kr), sans-serif",
        color: "#fff",
        zIndex: 100,
        padding: 20,
        textAlign: "center",
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      <div
        style={{
          fontSize: "0.8125rem",
          color: "#aaa",
          letterSpacing: "0.2em",
          marginBottom: 8,
        }}
      >
        <span lang="en">GAME OVER</span>
      </div>

      <div
        style={{
          fontSize: "clamp(3rem, 10vw, 5rem)",
          fontWeight: 700,
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {score.toLocaleString()}
      </div>

      <div style={{ fontSize: "0.875rem", color: "#0057FF", marginBottom: 32 }}>
        {stageName}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
          marginBottom: 40,
          maxWidth: 320,
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", color: "#aaa" }}><span lang="en">STAGE</span></div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{stageReached}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#aaa" }}><span lang="en">ITEMS</span></div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{itemsCollected}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#aaa" }}><span lang="en">TIME</span></div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onClick={onRestart}
          style={{
            background: "#0057FF",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "14px 40px",
            fontSize: "1rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: "pointer",
            fontFamily: "var(--font-oswald), sans-serif",
          }}
        >
          <span lang="en">RETRY</span>
        </button>

        {!saved && (
          <button
            type="button"
            onClick={saveScore}
            disabled={saving}
            aria-busy={saving}
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#aaa",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: "14px 28px",
              fontSize: "0.875rem",
              cursor: saving ? "wait" : "pointer",
              fontFamily: "var(--font-oswald), sans-serif",
            }}
          >
            <span lang="en">{saving ? 'SAVING...' : 'SAVE SCORE'}</span>
          </button>
        )}

        {saved && (
          <span style={{ color: "#00cc88", fontSize: "0.875rem", alignSelf: "center" }}>
            <span lang="en">SAVED!</span>
          </span>
        )}
      </div>

      <p ref={errorRef} tabIndex={-1} role="alert" aria-atomic="true" style={{ outline: 'none', ...(error ? { color: "#ff6666", fontSize: "0.75rem", marginTop: 12 } : {}) }}>{error ?? ''}</p>

      <Link
        href="/game/leaderboard"
        style={{
          color: "#aaa",
          fontSize: "0.8125rem",
          marginTop: 24,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          minHeight: 44,
          padding: "0 8px",
        }}
      >
        <span lang="en">LEADERBOARD</span> <span aria-hidden="true">→</span>
      </Link>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
