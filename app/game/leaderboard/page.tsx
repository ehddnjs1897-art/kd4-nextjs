"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

interface LeaderboardEntry {
  id: string
  user_id: string
  score: number
  stage: number
  items_collected: number
  duration_ms: number
  created_at: string
  profiles: { name: string | null } | null
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "alltime">("weekly")
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/game/scores?period=${period}&limit=20`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period])

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        fontFamily: "var(--font-oswald), var(--font-noto-sans-kr), sans-serif",
        color: "#fff",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <Link href="/game" style={{ color: "#666", fontSize: 14, textDecoration: "none" }}>
          ← BACK
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.1em" }}>LEADERBOARD</h1>
        <div style={{ width: 60 }} />
      </div>

      {/* Period toggle */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        {(["weekly", "alltime"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              background: period === p ? "#0057FF" : "rgba(255,255,255,0.05)",
              color: period === p ? "#fff" : "#666",
              border: period === p ? "none" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-oswald), sans-serif",
            }}
          >
            {p === "weekly" ? "WEEKLY" : "ALL TIME"}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#444", padding: 40 }}>LOADING...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", color: "#444", padding: 40 }}>
          <p>아직 기록이 없어요</p>
          <Link
            href="/game/play"
            style={{ color: "#0057FF", textDecoration: "none", fontSize: 14, marginTop: 12, display: "inline-block" }}
          >
            PLAY NOW →
          </Link>
        </div>
      ) : (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          {data.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                marginBottom: 4,
                borderRadius: 10,
                background:
                  i === 0
                    ? "rgba(0,87,255,0.12)"
                    : i < 3
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                borderLeft: i < 3 ? "3px solid #0057FF" : "3px solid transparent",
              }}
            >
              {/* Rank */}
              <div
                style={{
                  width: 32,
                  fontSize: i < 3 ? 22 : 16,
                  fontWeight: 700,
                  color: i === 0 ? "#0057FF" : i < 3 ? "#5599FF" : "#555",
                }}
              >
                {i + 1}
              </div>

              {/* Name + stage */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>
                  {entry.profiles?.name || "익명"}
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>
                  Stage {entry.stage} · {formatTime(entry.duration_ms)}
                </div>
              </div>

              {/* Score */}
              <div
                style={{
                  fontSize: i < 3 ? 22 : 18,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Play button */}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link
          href="/game/play"
          style={{
            display: "inline-block",
            background: "#0057FF",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 40px",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textDecoration: "none",
            fontFamily: "var(--font-oswald), sans-serif",
          }}
        >
          PLAY
        </Link>
      </div>
    </div>
  )
}
