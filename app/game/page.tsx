"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { CharacterType } from "@/components/game/SpotlightRush"

const STAGES = [
  { act: 1, title: "무명", stages: "1–4", desc: "이름 없는 시작" },
  { act: 2, title: "신인", stages: "5–8", desc: "첫 카메라 앞에 서다" },
  { act: 3, title: "성장", stages: "9–12", desc: "안방극장의 얼굴" },
  { act: 4, title: "스타", stages: "13–16", desc: "레드카펫 위의 주인공" },
  { act: 5, title: "전설", stages: "17–20", desc: "가면은 필요 없다" },
]

const CHARACTERS: { id: CharacterType; name: string; sub: string; emoji: string }[] = [
  { id: "xbot", name: "XBOT", sub: "테크 배우", emoji: "🤖" },
  { id: "soldier", name: "SOLDIER", sub: "액션 배우", emoji: "⚔️" },
  { id: "capsule", name: "NEON", sub: "사이파이 배우", emoji: "💙" },
]

export default function GameStartPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<CharacterType>("xbot")

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-oswald), var(--font-noto-sans-kr), sans-serif",
        color: "#fff",
        padding: "20px",
        textAlign: "center",
        position: "relative",
        overflowY: "auto",
      }}
    >
      {/* Back link */}
      <Link
        href="/"
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#666",
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        ← KD4.club
      </Link>

      {/* Leaderboard link */}
      <Link
        href="/game/leaderboard"
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          color: "#0057FF",
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        LEADERBOARD →
      </Link>

      {/* Title */}
      <h1
        style={{
          fontSize: "clamp(32px, 7vw, 64px)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          lineHeight: 1.1,
          marginBottom: 6,
          fontFamily: "var(--font-oswald), sans-serif",
        }}
      >
        OFF THE PLASTIC
      </h1>

      <p
        style={{
          fontSize: 13,
          color: "#0057FF",
          letterSpacing: "0.15em",
          marginBottom: 32,
          fontFamily: "var(--font-oswald), sans-serif",
        }}
      >
        KD4 ACTING STUDIO
      </p>

      {/* Character select */}
      <div style={{ marginBottom: 36, width: "100%", maxWidth: 420 }}>
        <p style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 14, fontFamily: "var(--font-oswald)" }}>
          SELECT CHARACTER
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {CHARACTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                flex: 1,
                maxWidth: 130,
                background: selected === c.id ? "rgba(0,87,255,0.18)" : "rgba(255,255,255,0.04)",
                border: selected === c.id ? "1.5px solid #0057FF" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "14px 8px",
                cursor: "pointer",
                color: "#fff",
                fontFamily: "var(--font-oswald), sans-serif",
                transition: "all 0.15s",
                outline: "none",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{c.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: selected === c.id ? "#4488ff" : "#aaa" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{c.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Stage preview */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 28,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 460,
        }}
      >
        {STAGES.map((s) => (
          <div
            key={s.act}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: "#0057FF", fontWeight: 600, fontFamily: "var(--font-oswald)" }}>
              ACT {s.act}
            </div>
            <div style={{ color: "#888" }}>{s.title}</div>
          </div>
        ))}
      </div>

      {/* How to play */}
      <div
        style={{
          fontSize: 12,
          color: "#555",
          marginBottom: 28,
          lineHeight: 1.8,
        }}
      >
        <p>📱 모바일: 폰을 기울여 좌우 이동</p>
        <p>⌨️ PC: 방향키 / WASD 이동</p>
        <p>탭 / 스페이스: 스포트라이트 부스트</p>
      </div>

      {/* Play button */}
      <button
        onClick={() => router.push(`/game/play?char=${selected}`)}
        style={{
          background: "#0057FF",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "16px 60px",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.12em",
          cursor: "pointer",
          fontFamily: "var(--font-oswald), sans-serif",
          transition: "transform 0.15s, box-shadow 0.15s",
          boxShadow: "0 0 40px rgba(0,87,255,0.3)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)"
          e.currentTarget.style.boxShadow = "0 0 60px rgba(0,87,255,0.5)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 0 40px rgba(0,87,255,0.3)"
        }}
      >
        PLAY
      </button>

      <p style={{ fontSize: 11, color: "#444", marginTop: 14 }}>
        무대 위로, 더 높이.
      </p>
    </div>
  )
}
