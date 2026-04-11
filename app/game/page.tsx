"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

const STAGES = [
  { act: 1, title: "무명", stages: "1–4", desc: "이름 없는 시작" },
  { act: 2, title: "신인", stages: "5–8", desc: "첫 카메라 앞에 서다" },
  { act: 3, title: "성장", stages: "9–12", desc: "안방극장의 얼굴" },
  { act: 4, title: "스타", stages: "13–16", desc: "레드카펫 위의 주인공" },
  { act: 5, title: "전설", stages: "17–20", desc: "가면은 필요 없다" },
]

export default function GameStartPage() {
  const router = useRouter()

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
          fontSize: "clamp(36px, 8vw, 72px)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          lineHeight: 1.1,
          marginBottom: 8,
          fontFamily: "var(--font-oswald), sans-serif",
        }}
      >
        OFF THE PLASTIC
      </h1>

      <p
        style={{
          fontSize: 14,
          color: "#0057FF",
          letterSpacing: "0.15em",
          marginBottom: 40,
          fontFamily: "var(--font-oswald), sans-serif",
        }}
      >
        KD4 ACTING STUDIO
      </p>

      {/* Stage preview */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 48,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 500,
        }}
      >
        {STAGES.map((s) => (
          <div
            key={s.act}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: "#0057FF", fontWeight: 600, fontFamily: "var(--font-oswald)" }}>
              ACT {s.act}
            </div>
            <div style={{ color: "#aaa" }}>{s.title}</div>
          </div>
        ))}
      </div>

      {/* How to play */}
      <div
        style={{
          fontSize: 13,
          color: "#666",
          marginBottom: 32,
          lineHeight: 1.8,
        }}
      >
        <p>📱 모바일: 폰을 기울여 좌우 이동</p>
        <p>⌨️ PC: 방향키 ← → 이동</p>
        <p>탭/클릭: 스포트라이트 부스트</p>
      </div>

      {/* Play button */}
      <button
        onClick={() => router.push("/game/play")}
        style={{
          background: "#0057FF",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "18px 64px",
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

      <p style={{ fontSize: 11, color: "#444", marginTop: 16 }}>
        무대 위로, 더 높이.
      </p>
    </div>
  )
}
