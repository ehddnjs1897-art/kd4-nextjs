"use client"

import dynamic from "next/dynamic"
import { useState, useCallback, useRef } from "react"
import GameUI from "@/components/game/GameUI"
import GameOver from "@/components/game/GameOver"

const SpotlightRush = dynamic(() => import("@/components/game/SpotlightRush"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#444",
        fontFamily: "var(--font-oswald), sans-serif",
        letterSpacing: "0.15em",
      }}
    >
      LOADING...
    </div>
  ),
})

interface StageInfo {
  title: string
  sub: string
  act: number
}

export default function GamePlayPage() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [height, setHeight] = useState(0)
  const [stage, setStage] = useState<StageInfo | null>(null)
  const [combo, setCombo] = useState<{ count: number; name: string; mult: number } | null>(null)
  const [specialText, setSpecialText] = useState<string | null>(null)
  const [gameOverData, setGameOverData] = useState<{
    score: number
    stageReached: number
    itemsCollected: number
    durationMs: number
  } | null>(null)
  const [gameKey, setGameKey] = useState(0)

  // Use refs for high-frequency updates to avoid re-renders
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const specialTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const callbacks = useCallback(
    () => ({
      onScoreChange: (s: number) => setScore(s),
      onLivesChange: (l: number) => setLives(l),
      onStageChange: (_i: number, s: StageInfo) => setStage(s),
      onCombo: (count: number, name: string, mult: number) => {
        setCombo({ count, name, mult })
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current)
        comboTimeoutRef.current = setTimeout(() => setCombo(null), 1500)
      },
      onComboReset: () => setCombo(null),
      onGameOver: (finalScore: number, stageReached: number, itemsCollected: number, durationMs: number) => {
        setGameOverData({ score: finalScore, stageReached, itemsCollected, durationMs })
      },
      onHeightChange: (h: number) => setHeight(h),
      onSpecialItem: (text: string) => {
        setSpecialText(text)
        if (specialTimeoutRef.current) clearTimeout(specialTimeoutRef.current)
        specialTimeoutRef.current = setTimeout(() => setSpecialText(null), 2000)
      },
    }),
    []
  )

  const handleRestart = () => {
    setScore(0)
    setLives(3)
    setHeight(0)
    setStage(null)
    setCombo(null)
    setSpecialText(null)
    setGameOverData(null)
    setGameKey((k) => k + 1)
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <SpotlightRush key={gameKey} callbacks={callbacks()} />
      <GameUI
        score={score}
        lives={lives}
        height={height}
        stage={stage}
        combo={combo}
        specialText={specialText}
      />
      {gameOverData && (
        <GameOver
          score={gameOverData.score}
          stageReached={gameOverData.stageReached}
          itemsCollected={gameOverData.itemsCollected}
          durationMs={gameOverData.durationMs}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
