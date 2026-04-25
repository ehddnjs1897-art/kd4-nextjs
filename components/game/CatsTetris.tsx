"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import Link from "next/link"

// ─── Constants ───────────────────────────────────────────────────────────────
const COLS = 10
const ROWS = 20
const CELL = 40          // px per cell
const PREVIEW_CELL = 28

// Cat emojis per piece type (I O T S Z J L)
const CATS = ["🐱", "😸", "😹", "😻", "😼", "😽", "🙀"]

// Standard Tetris pieces [rotations][cells as [row,col] offsets from pivot]
const PIECES: number[][][][] = [
  // I
  [[[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]]],
  // O
  [[[0,0],[0,1],[1,0],[1,1]], [[0,0],[0,1],[1,0],[1,1]], [[0,0],[0,1],[1,0],[1,1]], [[0,0],[0,1],[1,0],[1,1]]],
  // T
  [[[0,1],[1,0],[1,1],[1,2]], [[0,0],[1,0],[2,0],[1,1]], [[1,0],[1,1],[1,2],[2,1]], [[0,1],[1,1],[2,1],[1,0]]],
  // S
  [[[0,1],[0,2],[1,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]], [[0,1],[0,2],[1,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]]],
  // Z
  [[[0,0],[0,1],[1,1],[1,2]], [[0,1],[1,0],[1,1],[2,0]], [[0,0],[0,1],[1,1],[1,2]], [[0,1],[1,0],[1,1],[2,0]]],
  // J
  [[[0,0],[1,0],[1,1],[1,2]], [[0,0],[0,1],[1,0],[2,0]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,0],[2,1]]],
  // L
  [[[0,2],[1,0],[1,1],[1,2]], [[0,0],[1,0],[2,0],[2,1]], [[1,0],[1,1],[1,2],[2,0]], [[0,0],[0,1],[1,1],[2,1]]],
]

const COLORS = [
  "#00cfff", // I – sky blue
  "#ffe94d", // O – yellow
  "#b44fff", // T – purple
  "#4fff7e", // S – green
  "#ff4f4f", // Z – red
  "#ff8c42", // J – orange
  "#4f8cff", // L – blue
]

// ─── Types ───────────────────────────────────────────────────────────────────
interface Piece {
  type: number
  rot: number
  row: number
  col: number
}

type Board = (number | null)[][]  // null = empty, number = piece type index

// ─── Helpers ─────────────────────────────────────────────────────────────────
function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function cells(p: Piece): [number, number][] {
  return PIECES[p.type][p.rot].map(([dr, dc]) => [p.row + dr, p.col + dc])
}

function fits(board: Board, p: Piece): boolean {
  return cells(p).every(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === null)
}

function place(board: Board, p: Piece): Board {
  const b = board.map(row => [...row])
  cells(p).forEach(([r, c]) => { b[r][c] = p.type })
  return b
}

function clearLines(board: Board): [Board, number] {
  const kept = board.filter(row => row.some(v => v === null))
  const cleared = ROWS - kept.length
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null))
  return [[...empty, ...kept], cleared]
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * PIECES.length)
  return { type, rot: 0, row: 0, col: Math.floor(COLS / 2) - 1 }
}

function lineScore(lines: number, level: number): number {
  const base = [0, 100, 300, 500, 800]
  return (base[Math.min(lines, 4)] ?? 0) * (level + 1)
}

function dropInterval(level: number): number {
  return Math.max(100, 800 - level * 70)
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────
function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  current: Piece | null,
  ghost: Piece | null,
  floatingCats: FloatingCat[],
  frame: number
) {
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, ROWS * CELL)
  grad.addColorStop(0, "#0a0a1a")
  grad.addColorStop(1, "#0d0d2b")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

  // Floating background cats
  ctx.save()
  floatingCats.forEach(fc => {
    ctx.globalAlpha = fc.alpha
    ctx.font = `${fc.size}px serif`
    ctx.fillText(fc.emoji, fc.x, fc.y)
  })
  ctx.restore()

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)"
  ctx.lineWidth = 0.5
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke()
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(COLS * CELL, r * CELL); ctx.stroke()
  }

  // Ghost
  if (ghost) {
    ctx.save()
    ctx.globalAlpha = 0.2
    cells(ghost).forEach(([r, c]) => {
      const x = c * CELL, y = r * CELL
      ctx.fillStyle = COLORS[ghost.type]
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
    })
    ctx.restore()
  }

  // Placed cells
  board.forEach((row, r) => {
    row.forEach((v, c) => {
      if (v === null) return
      drawCell(ctx, r, c, v, CELL, 1.0, false, frame)
    })
  })

  // Current piece
  if (current) {
    cells(current).forEach(([r, c]) => {
      if (r >= 0) drawCell(ctx, r, c, current.type, CELL, 1.0, true, frame)
    })
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  r: number, c: number,
  type: number,
  size: number,
  alpha: number,
  animated: boolean,
  frame: number
) {
  const x = c * size, y = r * size
  ctx.save()
  ctx.globalAlpha = alpha

  // Tile background
  const grad = ctx.createLinearGradient(x, y, x + size, y + size)
  grad.addColorStop(0, COLORS[type] + "55")
  grad.addColorStop(1, COLORS[type] + "22")
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 5)
  ctx.fill()

  // Border glow
  ctx.strokeStyle = COLORS[type] + "cc"
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Cat emoji – slight bounce for active piece
  const bounce = animated ? Math.sin(frame * 0.15 + r + c) * 1.5 : 0
  const fontSize = size * 0.6
  ctx.font = `${fontSize}px serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.globalAlpha = alpha
  ctx.fillText(CATS[type], x + size / 2, y + size / 2 + bounce)

  ctx.restore()
}

function drawPreview(ctx: CanvasRenderingContext2D, type: number, size: number, frame: number) {
  const s = size
  ctx.clearRect(0, 0, 5 * s, 4 * s)
  ctx.fillStyle = "rgba(0,0,0,0.4)"
  ctx.fillRect(0, 0, 5 * s, 4 * s)

  const shape = PIECES[type][0]
  const minR = Math.min(...shape.map(([r]) => r))
  const minC = Math.min(...shape.map(([, c]) => c))
  const maxR = Math.max(...shape.map(([r]) => r))
  const maxC = Math.max(...shape.map(([, c]) => c))
  const offR = Math.floor((4 - (maxR - minR + 1)) / 2) - minR
  const offC = Math.floor((5 - (maxC - minC + 1)) / 2) - minC

  shape.forEach(([r, c]) => {
    drawCell(ctx, r + offR, c + offC, type, s, 1.0, true, frame)
  })
}

// ─── Floating background cats ─────────────────────────────────────────────────
interface FloatingCat {
  x: number; y: number; size: number
  speed: number; emoji: string; alpha: number
}

function initFloating(): FloatingCat[] {
  return Array.from({ length: 12 }, () => ({
    x: Math.random() * COLS * CELL,
    y: Math.random() * ROWS * CELL,
    size: 12 + Math.random() * 18,
    speed: 0.2 + Math.random() * 0.4,
    emoji: CATS[Math.floor(Math.random() * CATS.length)],
    alpha: 0.04 + Math.random() * 0.06,
  }))
}

function tickFloating(cats: FloatingCat[]): FloatingCat[] {
  return cats.map(fc => ({
    ...fc,
    y: fc.y + fc.speed > ROWS * CELL + 30 ? -30 : fc.y + fc.speed,
  }))
}

// ─── Component ────────────────────────────────────────────────────────────────
type GameState = "idle" | "playing" | "paused" | "over"

export default function CatsTetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    board: Board
    current: Piece | null
    next: number
    score: number
    lines: number
    level: number
    gameState: GameState
    floatingCats: FloatingCat[]
    dropTimer: number
    lastTime: number
    frame: number
    raf: number
    flashRows: Set<number>
    flashTimer: number
    touchStartX: number
    touchStartY: number
    touchLastX: number
    touchMoveThreshold: boolean
  }>({
    board: emptyBoard(),
    current: null,
    next: Math.floor(Math.random() * PIECES.length),
    score: 0,
    lines: 0,
    level: 0,
    gameState: "idle",
    floatingCats: initFloating(),
    dropTimer: 0,
    lastTime: 0,
    frame: 0,
    raf: 0,
    flashRows: new Set(),
    flashTimer: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchLastX: 0,
    touchMoveThreshold: false,
  })

  const [displayScore, setDisplayScore] = useState(0)
  const [displayLines, setDisplayLines] = useState(0)
  const [displayLevel, setDisplayLevel] = useState(0)
  const [gameState, setGameState] = useState<GameState>("idle")
  const [highScore, setHighScore] = useState(0)

  const updateDisplay = useCallback(() => {
    const s = stateRef.current
    setDisplayScore(s.score)
    setDisplayLines(s.lines)
    setDisplayLevel(s.level)
    setGameState(s.gameState)
  }, [])

  const startGame = useCallback(() => {
    const s = stateRef.current
    const first = randomPiece()
    s.board = emptyBoard()
    s.current = first
    s.next = Math.floor(Math.random() * PIECES.length)
    s.score = 0
    s.lines = 0
    s.level = 0
    s.gameState = "playing"
    s.dropTimer = 0
    s.lastTime = performance.now()
    s.frame = 0
    s.flashRows = new Set()
    s.flashTimer = 0
    updateDisplay()
  }, [updateDisplay])

  const computeGhost = useCallback((board: Board, p: Piece): Piece => {
    let ghost = { ...p }
    while (fits(board, { ...ghost, row: ghost.row + 1 })) ghost = { ...ghost, row: ghost.row + 1 }
    return ghost
  }, [])

  const lockPiece = useCallback(() => {
    const s = stateRef.current
    if (!s.current) return
    const ghost = computeGhost(s.board, s.current)
    s.board = place(s.board, ghost)
    const [newBoard, cleared] = clearLines(s.board)
    s.board = newBoard
    if (cleared > 0) {
      s.score += lineScore(cleared, s.level)
      s.lines += cleared
      s.level = Math.floor(s.lines / 10)
    }
    const next: Piece = { type: s.next, rot: 0, row: 0, col: Math.floor(COLS / 2) - 1 }
    s.next = Math.floor(Math.random() * PIECES.length)
    if (!fits(s.board, next)) {
      s.gameState = "over"
      setHighScore((prev: number) => Math.max(prev, s.score))
    } else {
      s.current = next
    }
    updateDisplay()
  }, [computeGhost, updateDisplay])

  const moveDown = useCallback(() => {
    const s = stateRef.current
    if (!s.current || s.gameState !== "playing") return
    const moved = { ...s.current, row: s.current.row + 1 }
    if (fits(s.board, moved)) {
      s.current = moved
    } else {
      lockPiece()
    }
  }, [lockPiece])

  const hardDrop = useCallback(() => {
    const s = stateRef.current
    if (!s.current || s.gameState !== "playing") return
    const ghost = computeGhost(s.board, s.current)
    s.score += (ghost.row - s.current.row) * 2
    s.current = ghost
    lockPiece()
    updateDisplay()
  }, [computeGhost, lockPiece, updateDisplay])

  const move = useCallback((dc: number) => {
    const s = stateRef.current
    if (!s.current || s.gameState !== "playing") return
    const moved = { ...s.current, col: s.current.col + dc }
    if (fits(s.board, moved)) s.current = moved
  }, [])

  const rotate = useCallback(() => {
    const s = stateRef.current
    if (!s.current || s.gameState !== "playing") return
    const newRot = (s.current.rot + 1) % 4
    const rotated = { ...s.current, rot: newRot }
    // Wall kick attempts
    const kicks = [0, 1, -1, 2, -2]
    for (const kick of kicks) {
      const kicked = { ...rotated, col: rotated.col + kick }
      if (fits(s.board, kicked)) { s.current = kicked; return }
    }
  }, [])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    const previewCanvas = previewRef.current
    if (!canvas || !previewCanvas) return
    const ctx = canvas.getContext("2d")!
    const pctx = previewCanvas.getContext("2d")!
    const s = stateRef.current

    const loop = (ts: number) => {
      s.raf = requestAnimationFrame(loop)
      const dt = ts - s.lastTime
      s.lastTime = ts
      s.frame++

      // Tick floating cats always
      s.floatingCats = tickFloating(s.floatingCats)

      if (s.gameState === "playing") {
        s.dropTimer += dt
        const interval = dropInterval(s.level)
        if (s.dropTimer >= interval) {
          s.dropTimer -= interval
          moveDown()
        }
      }

      const ghost = s.current && s.gameState === "playing"
        ? computeGhost(s.board, s.current)
        : null

      drawBoard(ctx, s.board, s.current, ghost, s.floatingCats, s.frame)

      // Preview
      if (s.gameState !== "idle") {
        drawPreview(pctx, s.next, PREVIEW_CELL, s.frame)
      } else {
        pctx.clearRect(0, 0, 5 * PREVIEW_CELL, 4 * PREVIEW_CELL)
      }
    }

    s.raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(s.raf)
  }, [moveDown, computeGhost])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (s.gameState === "over") {
        if (e.key === "Enter" || e.key === " ") startGame()
        return
      }
      if (s.gameState === "idle") {
        if (e.key === "Enter" || e.key === " ") startGame()
        return
      }
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        s.gameState = s.gameState === "paused" ? "playing" : "paused"
        updateDisplay()
        return
      }
      if (s.gameState !== "playing") return
      switch (e.key) {
        case "ArrowLeft":  case "a": case "A": e.preventDefault(); move(-1); break
        case "ArrowRight": case "d": case "D": e.preventDefault(); move(1);  break
        case "ArrowDown":  case "s": case "S": e.preventDefault(); moveDown(); break
        case "ArrowUp":    case "w": case "W": e.preventDefault(); rotate();   break
        case " ": e.preventDefault(); hardDrop(); break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [startGame, move, moveDown, rotate, hardDrop, updateDisplay])

  // Touch
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      s.touchStartX = e.touches[0].clientX
      s.touchStartY = e.touches[0].clientY
      s.touchLastX = s.touchStartX
      s.touchMoveThreshold = false
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const dx = e.touches[0].clientX - s.touchLastX
      if (Math.abs(dx) >= 30) {
        move(dx > 0 ? 1 : -1)
        s.touchLastX = e.touches[0].clientX
        s.touchMoveThreshold = true
      }
      const dy = e.touches[0].clientY - s.touchStartY
      if (dy > 60) {
        hardDrop()
        s.touchStartY = e.touches[0].clientY
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      const gs = s.gameState
      if (gs === "idle" || gs === "over") { startGame(); return }
      if (!s.touchMoveThreshold) {
        const dy = e.changedTouches[0].clientY - s.touchStartY
        if (Math.abs(dy) < 20) rotate()
      }
    }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false })
    canvas.addEventListener("touchmove", onTouchMove, { passive: false })
    canvas.addEventListener("touchend", onTouchEnd, { passive: false })
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchmove", onTouchMove)
      canvas.removeEventListener("touchend", onTouchEnd)
    }
  }, [move, moveDown, rotate, hardDrop, startGame])

  const W = COLS * CELL
  const H = ROWS * CELL

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #050510 0%, #0a0a1a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-oswald), sans-serif",
      padding: "16px",
      userSelect: "none",
    }}>
      {/* Back link */}
      <Link href="/" style={{
        position: "fixed", top: 16, left: 16,
        color: "#555", fontSize: 13, textDecoration: "none", zIndex: 10,
      }}>
        ← KD4.club
      </Link>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 36px)", color: "#fff", letterSpacing: "0.08em", margin: 0 }}>
          🐱 CATS TETRIS
        </h1>
        <p style={{ fontSize: 11, color: "#555", margin: "4px 0 0", letterSpacing: "0.15em" }}>
          하늘에서 고양이가 내려온다
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>

        {/* Left panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 90 }}>
          <ScoreBox label="SCORE" value={displayScore} />
          <ScoreBox label="LINES" value={displayLines} />
          <ScoreBox label="LEVEL" value={displayLevel} />
          <ScoreBox label="BEST" value={highScore} accent />
        </div>

        {/* Game canvas */}
        <div style={{ position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{
              display: "block",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 40px rgba(0,100,255,0.15)",
              cursor: "pointer",
              touchAction: "none",
            }}
          />

          {/* Overlay */}
          {(gameState === "idle" || gameState === "over" || gameState === "paused") && (
            <Overlay
              state={gameState}
              score={displayScore}
              onStart={startGame}
            />
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 90 }}>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "10px 8px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", marginBottom: 8 }}>NEXT</p>
            <canvas
              ref={previewRef}
              width={5 * PREVIEW_CELL}
              height={4 * PREVIEW_CELL}
              style={{ display: "block", margin: "0 auto" }}
            />
          </div>

          <Controls
            onLeft={() => move(-1)}
            onRight={() => move(1)}
            onDown={moveDown}
            onRotate={rotate}
            onDrop={hardDrop}
            disabled={gameState !== "playing"}
          />
        </div>
      </div>

      {/* Keyboard hints */}
      <div style={{
        marginTop: 12, fontSize: 10, color: "#444", letterSpacing: "0.08em", textAlign: "center", lineHeight: 1.8,
      }}>
        <span>← → 이동 &nbsp;|&nbsp; ↑ / W 회전 &nbsp;|&nbsp; SPACE 드롭 &nbsp;|&nbsp; P 일시정지</span><br />
        <span>모바일: 탭=회전, 스와이프=이동, 아래 스와이프=드롭</span>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ScoreBox({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${accent ? "rgba(255,210,50,0.3)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 8,
      padding: "8px 6px",
      textAlign: "center",
    }}>
      <p style={{ fontSize: 9, color: accent ? "#ffd232" : "#555", letterSpacing: "0.12em", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 16, color: accent ? "#ffd232" : "#fff", fontWeight: 700, margin: 0 }}>{value.toLocaleString()}</p>
    </div>
  )
}

function Overlay({ state, score, onStart }: { state: GameState; score: number; onStart: () => void }) {
  const isOver = state === "over"
  const isPaused = state === "paused"
  return (
    <div
      onClick={onStart}
      style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        borderRadius: 8,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 48 }}>{isOver ? "😿" : isPaused ? "😼" : "🐱"}</div>
      <h2 style={{ color: "#fff", fontSize: 22, letterSpacing: "0.12em", margin: 0 }}>
        {isOver ? "GAME OVER" : isPaused ? "PAUSED" : "CATS TETRIS"}
      </h2>
      {isOver && (
        <p style={{ color: "#aaa", fontSize: 14, margin: 0 }}>점수 {score.toLocaleString()}점</p>
      )}
      <button
        onClick={onStart}
        style={{
          background: "#0057FF",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "12px 32px",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.1em",
          cursor: "pointer",
          fontFamily: "inherit",
          marginTop: 4,
        }}
      >
        {isOver ? "다시 하기" : isPaused ? "계속하기" : "START"}
      </button>
      {!isOver && !isPaused && (
        <p style={{ color: "#444", fontSize: 11, margin: 0, letterSpacing: "0.1em" }}>
          고양이들이 하강 중... 받아라!
        </p>
      )}
    </div>
  )
}

function Controls({
  onLeft, onRight, onDown, onRotate, onDrop, disabled,
}: {
  onLeft: () => void; onRight: () => void; onDown: () => void
  onRotate: () => void; onDrop: () => void; disabled: boolean
}) {
  const btn = (label: string, fn: () => void, wide?: boolean) => (
    <button
      onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); if (!disabled) fn() }}
      style={{
        flex: wide ? "1 0 100%" : 1,
        background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: disabled ? "#333" : "#fff",
        fontSize: 14,
        padding: "10px 4px",
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {btn("↺", onRotate, true)}
      {btn("←", onLeft)}
      {btn("→", onRight)}
      {btn("↓", onDown, true)}
      {btn("⬇︎", onDrop, true)}
    </div>
  )
}
