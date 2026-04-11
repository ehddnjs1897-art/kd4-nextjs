"use client"

import { useState, useEffect, useRef } from "react"

interface Stage {
  title: string
  sub: string
  act: number
}

interface GameUIProps {
  score: number
  lives: number
  height: number
  stage: Stage | null
  combo: { count: number; name: string; mult: number } | null
  specialText: string | null
}

export default function GameUI({ score, lives, height, stage, combo, specialText }: GameUIProps) {
  const [stageFlash, setStageFlash] = useState<Stage | null>(null)
  const [comboFlash, setComboFlash] = useState<typeof combo>(null)
  const [specialFlash, setSpecialFlash] = useState<string | null>(null)
  const prevStage = useRef<string | null>(null)

  // Stage transition flash
  useEffect(() => {
    if (stage && stage.title !== prevStage.current) {
      prevStage.current = stage.title
      setStageFlash(stage)
      const timer = setTimeout(() => setStageFlash(null), 2500)
      return () => clearTimeout(timer)
    }
  }, [stage])

  // Combo flash
  useEffect(() => {
    if (combo) {
      setComboFlash(combo)
      const timer = setTimeout(() => setComboFlash(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [combo])

  // Special item flash (1UP etc)
  useEffect(() => {
    if (specialText) {
      setSpecialFlash(specialText)
      const timer = setTimeout(() => setSpecialFlash(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [specialText])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "var(--font-oswald), var(--font-noto-sans-kr), sans-serif",
        color: "#fff",
      }}
    >
      {/* Top bar: score + lives */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Score */}
        <div>
          <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em" }}>SCORE</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.05em" }}>
            {score.toLocaleString()}
          </div>
        </div>

        {/* Lives */}
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: i < lives ? "#0057FF" : "rgba(255,255,255,0.1)",
                boxShadow: i < lives ? "0 0 8px rgba(0,87,255,0.5)" : "none",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Height indicator */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 16,
          fontSize: 11,
          color: "#444",
          letterSpacing: "0.1em",
        }}
      >
        {Math.floor(height)}m
      </div>

      {/* Stage name (current) */}
      {stage && (
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 16,
            textAlign: "right",
            fontSize: 11,
            color: "#555",
          }}
        >
          <div style={{ color: "#0057FF", fontWeight: 600 }}>ACT {stage.act}</div>
          <div>{stage.title}</div>
        </div>
      )}

      {/* Stage transition flash */}
      {stageFlash && (
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            animation: "fadeInUp 0.5s ease-out",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#0057FF",
              letterSpacing: "0.2em",
              marginBottom: 8,
            }}
          >
            ACT {stageFlash.act}
          </div>
          <div
            style={{
              fontSize: "clamp(24px, 6vw, 40px)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: 8,
              textShadow: "0 0 30px rgba(0,87,255,0.5)",
            }}
          >
            {stageFlash.title}
          </div>
          <div style={{ fontSize: 14, color: "#888", fontStyle: "italic" }}>
            {stageFlash.sub}
          </div>
        </div>
      )}

      {/* Combo flash */}
      {comboFlash && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: "#ffaa00" }}>
            {comboFlash.name}!
          </div>
          <div style={{ fontSize: 16, color: "#ffcc44" }}>
            x{comboFlash.mult} COMBO
          </div>
        </div>
      )}

      {/* Special item flash (1UP / OFF THE PLASTIC) */}
      {specialFlash && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            animation: "fadeInUp 0.4s ease-out",
          }}
        >
          <div
            style={{
              fontSize: "clamp(28px, 7vw, 48px)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: specialFlash === "OFF THE PLASTIC" ? "#00ffaa" : "#ffaa00",
              textShadow: specialFlash === "OFF THE PLASTIC"
                ? "0 0 40px rgba(0,255,170,0.6)"
                : "0 0 30px rgba(255,170,0,0.5)",
            }}
          >
            {specialFlash}
          </div>
          {specialFlash === "OFF THE PLASTIC" && (
            <div style={{ fontSize: 14, color: "#00cc88", marginTop: 8 }}>
              +1 UP
            </div>
          )}
        </div>
      )}

      {/* CSS animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, -40%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </div>
  )
}
