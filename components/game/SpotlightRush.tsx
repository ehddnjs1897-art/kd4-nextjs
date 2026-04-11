"use client"

import * as THREE from "three"
import { useEffect, useRef, useCallback } from "react"

// ─── Stage Data ──────────────────────────────────────────────────────────────

const STAGES = [
  // ACT 1: 무명
  { height: 0,    title: "무명의 메모",       sub: '"이름 없는 누군가에게"',        points: 3,   act: 1 },
  { height: 50,   title: "오디션 번호표",     sub: '"342번, 들어오세요"',            points: 5,   act: 1 },
  { height: 120,  title: "엑스트라 콜시트",   sub: '"배경 오른쪽, 지나가세요"',      points: 7,   act: 1 },
  { height: 200,  title: "단편의 사이드",     sub: '"이 대본, 한번 읽어볼래요?"',    points: 10,  act: 1 },
  // ACT 2: 신인
  { height: 300,  title: "독립영화 러브콜",   sub: '"당신만의 색이 보여요"',          points: 13,  act: 2 },
  { height: 450,  title: "첫 대사 한 줄",     sub: '"레디... 액션!"',                points: 16,  act: 2 },
  { height: 600,  title: "콜백 통보",         sub: '"2차 오디션 오세요"',             points: 20,  act: 2 },
  { height: 800,  title: "크랭크인 소식",     sub: '"다음 주 촬영 시작합니다"',       points: 25,  act: 2 },
  // ACT 3: 성장
  { height: 1000, title: "안방극장의 얼굴",   sub: '"본방사수할게!"',                points: 30,  act: 3 },
  { height: 1300, title: "첫 팬레터",         sub: '"언니/오빠 응원해요"',            points: 35,  act: 3 },
  { height: 1600, title: "주연 캐스팅 확정",  sub: '"이 작품의 중심은 당신"',         points: 40,  act: 3 },
  { height: 2000, title: "천만 관객 티켓",    sub: '"극장이 당신으로 찼다"',          points: 50,  act: 3 },
  // ACT 4: 스타
  { height: 2500, title: "레드카펫 패스",     sub: '"플래시가 쏟아진다"',             points: 60,  act: 4 },
  { height: 3000, title: "해외 배급 계약서",  sub: '"전 세계가 기다립니다"',           points: 70,  act: 4 },
  { height: 3500, title: "영화제 초청장",     sub: '"공식 경쟁부문 초청"',            points: 85,  act: 4 },
  { height: 4000, title: "트로피 각인",       sub: '"그리고 수상자는..."',            points: 100, act: 4 },
  // ACT 5: 전설
  { height: 5000, title: "거장의 지명",       sub: '"다음 작품, 당신이어야 해"',      points: 130, act: 5 },
  { height: 6000, title: "마스터클래스 초대",  sub: '"이제 가르칠 차례입니다"',        points: 160, act: 5 },
  { height: 7500, title: "전설의 크레딧",     sub: '"역사에 이름을 새기다"',          points: 200, act: 5 },
  { height: 10000,title: "OFF THE PLASTIC",   sub: '"가면은 필요 없다"',             points: 500, act: 5 },
]

const ACT_COLORS: Record<number, { bg: number; accent: number; fog: number }> = {
  1: { bg: 0x020202, accent: 0x0057FF, fog: 0x020202 },
  2: { bg: 0x030308, accent: 0x0066FF, fog: 0x030308 },
  3: { bg: 0x050510, accent: 0x1177FF, fog: 0x050510 },
  4: { bg: 0x0a0515, accent: 0x3388FF, fog: 0x0a0515 },
  5: { bg: 0x08081a, accent: 0x55aaFF, fog: 0x08081a },
}

const COMBO_NAMES = [
  { count: 3,  name: "대본리딩", mult: 1.5 },
  { count: 5,  name: "리허설",   mult: 2.0 },
  { count: 10, name: "본촬",     mult: 3.0 },
  { count: 15, name: "원테이크", mult: 4.0 },
  { count: 20, name: "명연기",   mult: 5.0 },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface Collectible {
  mesh: THREE.Group | THREE.Mesh
  type: "ticket" | "special"
  points: number
  specialType?: string
  collected: boolean
}

interface Obstacle {
  group: THREE.Group
  pattern: "horizontal" | "pendulum" | "vertical" | "swing"
  speed: number
  baseX: number
  baseY: number
  phase: number
  collected: boolean
}

interface Platform {
  mesh: THREE.Group
  baseY: number
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void
  onLivesChange: (lives: number) => void
  onStageChange: (stageIndex: number, stage: typeof STAGES[0]) => void
  onCombo: (combo: number, name: string, mult: number) => void
  onComboReset: () => void
  onGameOver: (finalScore: number, stageReached: number, itemsCollected: number, durationMs: number) => void
  onHeightChange: (height: number) => void
  onSpecialItem: (text: string) => void
}

// ─── Helper: create human silhouette ─────────────────────────────────────────

function createHumanoid() {
  const group = new THREE.Group()

  const skinColor = 0x1a1a2e
  const accentColor = 0x0057FF

  // Head
  const headGeo = new THREE.SphereGeometry(0.22, 16, 12)
  const headMat = new THREE.MeshStandardMaterial({ color: 0x16213e, roughness: 0.6, metalness: 0.2 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.65
  group.add(head)

  // Mask (front face - glossy white/cream)
  const maskGeo = new THREE.SphereGeometry(0.235, 16, 12, 0, Math.PI, 0, Math.PI * 0.85)
  const maskMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6d3,
    roughness: 0.15,
    metalness: 0.4,
    transparent: true,
    opacity: 1,
  })
  const mask = new THREE.Mesh(maskGeo, maskMat)
  mask.position.y = 1.65
  mask.rotation.y = Math.PI
  group.add(mask)

  // Eye holes on mask (dark indents)
  const eyeGeo = new THREE.CircleGeometry(0.04, 8)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.08, 1.68, 0.22)
  group.add(eyeL)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.08, 1.68, 0.22)
  group.add(eyeR)

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.4, 0.55, 0.22)
  const torsoMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7, metalness: 0.1 })
  const torso = new THREE.Mesh(torsoGeo, torsoMat)
  torso.position.y = 1.15
  group.add(torso)

  // Shoulders (rounded)
  const shoulderGeo = new THREE.SphereGeometry(0.12, 8, 6)
  const shoulderMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 })
  const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat)
  shoulderL.position.set(-0.24, 1.38, 0)
  group.add(shoulderL)
  const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat)
  shoulderR.position.set(0.24, 1.38, 0)
  group.add(shoulderR)

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6)
  const armMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 })
  const armL = new THREE.Mesh(armGeo, armMat)
  armL.position.set(-0.3, 1.05, 0)
  armL.rotation.z = 0.15
  group.add(armL)
  const armR = new THREE.Mesh(armGeo, armMat)
  armR.position.set(0.3, 1.05, 0)
  armR.rotation.z = -0.15
  group.add(armR)

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.6, 6)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.8 })
  const legL = new THREE.Mesh(legGeo, legMat)
  legL.position.set(-0.1, 0.5, 0)
  group.add(legL)
  const legR = new THREE.Mesh(legGeo, legMat)
  legR.position.set(0.1, 0.5, 0)
  group.add(legR)

  // Glow ring at feet
  const glowGeo = new THREE.RingGeometry(0.35, 0.45, 32)
  const glowMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.rotation.x = -Math.PI / 2
  glow.position.y = 0.15
  group.add(glow)

  // Point light on character
  const charLight = new THREE.PointLight(accentColor, 1.5, 5)
  charLight.position.y = 1.2
  group.add(charLight)

  return { group, maskMat, glowMat, head, armL, armR, legL, legR }
}

// ─── Helper: create glowing ticket ───────────────────────────────────────────

function createTicket(color: number) {
  const group = new THREE.Group()

  // Card body
  const cardGeo = new THREE.PlaneGeometry(0.7, 0.45)
  const cardMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.7,
    roughness: 0.2,
    emissive: color,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  })
  const card = new THREE.Mesh(cardGeo, cardMat)
  group.add(card)

  // Inner line border
  const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.6, 0.35))
  const borderMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  const border = new THREE.LineSegments(borderGeo, borderMat)
  border.position.z = 0.01
  group.add(border)

  // Small star/dot in center
  const dotGeo = new THREE.CircleGeometry(0.04, 6)
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
  const dot = new THREE.Mesh(dotGeo, dotMat)
  dot.position.z = 0.02
  group.add(dot)

  // Glow halo behind card
  const haloGeo = new THREE.PlaneGeometry(1.0, 0.7)
  const haloMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
  })
  const halo = new THREE.Mesh(haloGeo, haloMat)
  halo.position.z = -0.05
  group.add(halo)

  // Point light
  const light = new THREE.PointLight(color, 0.8, 4)
  light.position.z = 0.5
  group.add(light)

  return group
}

// ─── Helper: create obstacle ─────────────────────────────────────────────────

function createObstacle(act: number) {
  const group = new THREE.Group()

  // Boom mic / light rig / barrier depending on act
  const color = act >= 4 ? 0xff3344 : act >= 3 ? 0xff4444 : 0xcc3333

  // Main bar
  const barGeo = new THREE.BoxGeometry(1.6, 0.12, 0.12)
  const barMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.8,
  })
  const bar = new THREE.Mesh(barGeo, barMat)
  group.add(bar)

  // Warning stripes
  const stripeGeo = new THREE.BoxGeometry(0.15, 0.14, 0.14)
  const stripeMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    roughness: 0.5,
  })
  for (let i = -3; i <= 3; i++) {
    if (i % 2 === 0) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat)
      stripe.position.x = i * 0.2
      group.add(stripe)
    }
  }

  // Danger glow
  const glowGeo = new THREE.PlaneGeometry(2.0, 0.5)
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
  })
  const glowPlane = new THREE.Mesh(glowGeo, glowMat)
  glowPlane.position.z = 0.1
  group.add(glowPlane)

  return group
}

// ─── Helper: create floating platform ────────────────────────────────────────

function createPlatform(width: number, act: number) {
  const group = new THREE.Group()
  const accent = ACT_COLORS[act]?.accent || 0x0057FF

  // Platform body
  const platGeo = new THREE.BoxGeometry(width, 0.08, 1.5)
  const platMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    roughness: 0.6,
    metalness: 0.3,
  })
  const plat = new THREE.Mesh(platGeo, platMat)
  group.add(plat)

  // Edge glow line
  const edgeGeo = new THREE.BoxGeometry(width + 0.05, 0.02, 0.02)
  const edgeMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.5,
  })
  const edgeFront = new THREE.Mesh(edgeGeo, edgeMat)
  edgeFront.position.set(0, 0.045, 0.75)
  group.add(edgeFront)
  const edgeBack = new THREE.Mesh(edgeGeo, edgeMat.clone())
  edgeBack.position.set(0, 0.045, -0.75)
  group.add(edgeBack)

  return group
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpotlightRush({ callbacks }: { callbacks: GameCallbacks }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<{ cleanup: () => void } | null>(null)

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── State ──
    let score = 0
    let lives = 3
    let height = 0
    let currentStageIndex = 0
    let currentAct = 1
    let combo = 0
    let itemsCollected = 0
    let gameOver = false
    const startTime = Date.now()
    let playerX = 0
    let playerTargetX = 0
    const BASE_SPEED = 0.15
    let speedMultiplier = 1
    let boostTimer = 0
    let invincibleTimer = 0
    let lastSpawnHeight = 0
    let lastObstacleHeight = 0
    let lastPlatformHeight = 0

    const collectibles: Collectible[] = []
    const obstacles: Obstacle[] = []
    const particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = []
    const platforms: Platform[] = []
    const bgParticles: THREE.Mesh[] = []
    const lightBeams: THREE.Mesh[] = []

    // ── Renderer ──
    const isMobile = window.innerWidth <= 768
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false })
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.8

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020202)
    scene.fog = new THREE.FogExp2(0x020202, 0.025)

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 250)
    camera.position.set(0, 3, 10)
    camera.lookAt(0, 5, 0)

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x0a0a15, 1.5))

    // Main spotlight from above
    const spotMain = new THREE.SpotLight(0xfff4e0, 4, 60, Math.PI / 7, 0.6, 1)
    spotMain.position.set(0, 20, 8)
    spotMain.target.position.set(0, 0, 0)
    scene.add(spotMain)
    scene.add(spotMain.target)

    // Blue accent light
    const spotBlue = new THREE.SpotLight(0x0057FF, 3, 50, Math.PI / 5, 0.5, 1)
    spotBlue.position.set(-4, 25, 3)
    spotBlue.target.position.set(0, 5, 0)
    scene.add(spotBlue)
    scene.add(spotBlue.target)

    // Rim light from behind
    const spotRim = new THREE.SpotLight(0x2244aa, 2, 40, Math.PI / 6, 0.7, 1.5)
    spotRim.position.set(2, 15, -5)
    spotRim.target.position.set(0, 3, 2)
    scene.add(spotRim)
    scene.add(spotRim.target)

    // ── Environment: Tunnel/corridor ──
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 0.92, metalness: 0.08 })

    // Left wall
    const wallGeo = new THREE.PlaneGeometry(300, 300)
    const wallL = new THREE.Mesh(wallGeo, wallMat)
    wallL.rotation.y = Math.PI / 2
    wallL.position.set(-6, 0, 0)
    scene.add(wallL)

    // Right wall
    const wallR = new THREE.Mesh(wallGeo.clone(), wallMat.clone())
    wallR.rotation.y = -Math.PI / 2
    wallR.position.set(6, 0, 0)
    scene.add(wallR)

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 300), wallMat.clone())
    backWall.position.set(0, 0, -4)
    scene.add(backWall)

    // ── Wall trim lines (vertical blue neon lines) ──
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x0057FF, transparent: true, opacity: 0.15 })
    for (let x = -5.95; x <= 5.95; x += 11.9) {
      const trimGeo = new THREE.PlaneGeometry(0.03, 300)
      const trim = new THREE.Mesh(trimGeo, trimMat)
      trim.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2
      trim.position.set(x, 0, 0)
      scene.add(trim)
    }

    // ── Horizontal grid lines on walls ──
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x0057FF, transparent: true, opacity: 0.04 })
    for (let y = 0; y < 300; y += 5) {
      const gridGeo = new THREE.PlaneGeometry(12, 0.01)
      const grid = new THREE.Mesh(gridGeo, gridMat)
      grid.position.set(0, y, -3.99)
      scene.add(grid)
    }

    // ── Background floating dust particles ──
    const dustGeo = new THREE.SphereGeometry(0.02, 4, 4)
    const dustMat = new THREE.MeshBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.4 })
    for (let i = 0; i < 80; i++) {
      const dust = new THREE.Mesh(dustGeo, dustMat.clone())
      dust.position.set(
        (Math.random() - 0.5) * 10,
        Math.random() * 100,
        (Math.random() - 0.5) * 6
      )
      scene.add(dust)
      bgParticles.push(dust)
    }

    // ── Light beams (vertical streaks) ──
    const beamGeo = new THREE.PlaneGeometry(0.08, 30)
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x0057FF, transparent: true, opacity: 0.04, side: THREE.DoubleSide })
    for (let i = 0; i < 6; i++) {
      const beam = new THREE.Mesh(beamGeo.clone(), beamMat.clone())
      beam.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 50,
        -2 + Math.random() * 3
      )
      scene.add(beam)
      lightBeams.push(beam)
    }

    // ── Player ──
    const player = createHumanoid()
    const maskGroup = player.group
    maskGroup.position.set(0, 0, 2)
    scene.add(maskGroup)

    // Track crack lines
    const crackLines: THREE.Line[] = []
    const addCrackLine = () => {
      const points = []
      const startAngle = Math.random() * Math.PI
      for (let i = 0; i < 6; i++) {
        const angle = startAngle + (Math.random() - 0.5) * 0.9
        const r = 0.2 + Math.random() * 0.05
        points.push(new THREE.Vector3(
          Math.sin(angle) * r,
          1.65 + (Math.random() - 0.5) * 0.3,
          Math.cos(angle) * r + 0.05
        ))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({ color: 0x0057FF, opacity: 0.8, transparent: true })
      const line = new THREE.Line(geo, mat)
      maskGroup.add(line)
      crackLines.push(line)
    }

    // ── Spawn collectible ──
    const spawnCollectible = (y: number) => {
      const stage = STAGES[currentStageIndex] || STAGES[STAGES.length - 1]
      const x = (Math.random() - 0.5) * 7

      const stageColor = ACT_COLORS[stage.act]?.accent || 0x0057FF
      const ticket = createTicket(stageColor)
      ticket.position.set(x, y, 2)
      scene.add(ticket)

      collectibles.push({
        mesh: ticket,
        type: "ticket",
        points: stage.points,
        collected: false,
      })

      // Rare: special items
      const rand = Math.random()
      if (rand < 0.05) {
        // 1UP sphere with inner glow
        const specialGroup = new THREE.Group()
        const outerGeo = new THREE.SphereGeometry(0.3, 16, 12)
        const outerMat = new THREE.MeshStandardMaterial({
          color: 0x00ffaa,
          emissive: 0x00ffaa,
          emissiveIntensity: 0.6,
          metalness: 0.9,
          roughness: 0.1,
          transparent: true,
          opacity: 0.8,
        })
        specialGroup.add(new THREE.Mesh(outerGeo, outerMat))

        // Inner core
        const innerGeo = new THREE.SphereGeometry(0.15, 8, 8)
        const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
        specialGroup.add(new THREE.Mesh(innerGeo, innerMat))

        // Point light
        const sLight = new THREE.PointLight(0x00ffaa, 2, 6)
        specialGroup.add(sLight)

        const sx = (Math.random() - 0.5) * 7
        specialGroup.position.set(sx, y + 3, 2)
        scene.add(specialGroup)
        collectibles.push({
          mesh: specialGroup,
          type: "special",
          points: 0,
          specialType: "1up",
          collected: false,
        })
      } else if (rand < 0.09) {
        // Magnet - spinning octahedron with trails
        const specialGroup = new THREE.Group()
        const octGeo = new THREE.OctahedronGeometry(0.25, 0)
        const octMat = new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          emissive: 0xffaa00,
          emissiveIntensity: 0.5,
          metalness: 0.8,
          roughness: 0.2,
        })
        specialGroup.add(new THREE.Mesh(octGeo, octMat))

        // Ring around it
        const ringGeo = new THREE.TorusGeometry(0.35, 0.02, 8, 24)
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.5 })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = Math.PI / 2
        specialGroup.add(ring)

        const sLight = new THREE.PointLight(0xffaa00, 1.5, 5)
        specialGroup.add(sLight)

        const sx = (Math.random() - 0.5) * 7
        specialGroup.position.set(sx, y + 5, 2)
        scene.add(specialGroup)
        collectibles.push({
          mesh: specialGroup,
          type: "special",
          points: 0,
          specialType: "magnet",
          collected: false,
        })
      }
    }

    // ── Spawn obstacle ──
    const spawnObstacle = (y: number) => {
      const x = (Math.random() - 0.5) * 5
      const obsGroup = createObstacle(currentAct)
      obsGroup.position.set(x, y, 2)
      scene.add(obsGroup)

      const patterns: Obstacle["pattern"][] = ["horizontal", "pendulum", "vertical", "swing"]
      obstacles.push({
        group: obsGroup,
        pattern: patterns[Math.floor(Math.random() * patterns.length)],
        speed: 0.5 + Math.random() * 1.5,
        baseX: x,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
        collected: false,
      })
    }

    // ── Spawn platform ──
    const spawnPlatform = (y: number) => {
      const x = (Math.random() - 0.5) * 6
      const w = 2 + Math.random() * 3
      const plat = createPlatform(w, currentAct)
      plat.position.set(x, y, 1)
      scene.add(plat)
      platforms.push({ mesh: plat, baseY: y })
    }

    // ── Spawn particles ──
    const spawnParticles = (pos: THREE.Vector3, color: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const size = 0.03 + Math.random() * 0.04
        const geo = new THREE.SphereGeometry(size, 4, 4)
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.copy(pos)
        scene.add(mesh)
        particles.push({
          mesh,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.2 + 0.05,
            (Math.random() - 0.5) * 0.15
          ),
          life: 1,
        })
      }
    }

    // ── Update mask crack ──
    const updateMaskCrack = () => {
      const progress = currentStageIndex / (STAGES.length - 1)
      player.maskMat.opacity = 1 - progress * 0.95
      const targetCracks = Math.floor(progress * 18)
      while (crackLines.length < targetCracks) {
        addCrackLine()
      }
    }

    // ── Input ──
    let tiltX = 0
    let magnetTimer = 0
    let useGyro = false

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        useGyro = true
        tiltX = (e.gamma / 45) * 4
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") playerTargetX = Math.max(-4.5, playerTargetX - 0.5)
      if (e.key === "ArrowRight") playerTargetX = Math.min(4.5, playerTargetX + 0.5)
      if (e.key === " " || e.key === "Enter") boostTimer = 0.5
    }

    const handleTouch = () => {
      boostTimer = 0.5
    }

    const requestGyro = async () => {
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof DOE.requestPermission === "function") {
        try {
          const perm = await DOE.requestPermission()
          if (perm === "granted") {
            window.addEventListener("deviceorientation", handleOrientation)
          }
        } catch { /* fallback to keyboard */ }
      } else {
        window.addEventListener("deviceorientation", handleOrientation)
      }
    }

    requestGyro()
    window.addEventListener("keydown", handleKeyDown)
    canvas.addEventListener("touchstart", handleTouch, { passive: true })
    canvas.addEventListener("click", handleTouch)

    // ── Initial spawns ──
    for (let y = 5; y < 60; y += 3 + Math.random() * 3) {
      spawnCollectible(y)
    }
    for (let y = 8; y < 60; y += 6 + Math.random() * 8) {
      spawnObstacle(y)
    }
    for (let y = 4; y < 60; y += 8 + Math.random() * 6) {
      spawnPlatform(y)
    }
    lastSpawnHeight = 60
    lastObstacleHeight = 60
    lastPlatformHeight = 60

    // ── Animation loop ──
    let animFrameId: number
    let lastTime = performance.now()

    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate)
      if (gameOver) return

      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      // Speed
      speedMultiplier = 1 + height * 0.0003
      const currentSpeed = BASE_SPEED * speedMultiplier * (boostTimer > 0 ? 2.5 : 1)
      height += currentSpeed * 60 * dt

      if (boostTimer > 0) boostTimer -= dt
      if (invincibleTimer > 0) invincibleTimer -= dt
      if (magnetTimer > 0) magnetTimer -= dt

      // Player movement
      if (useGyro) {
        playerTargetX = THREE.MathUtils.clamp(tiltX, -4.5, 4.5)
      }
      playerX += (playerTargetX - playerX) * 8 * dt

      // Update player
      maskGroup.position.x = playerX
      maskGroup.position.y = height

      // Arm/leg sway animation
      const sway = Math.sin(now * 0.006) * 0.12
      player.armL.rotation.x = sway
      player.armR.rotation.x = -sway
      player.legL.rotation.x = -sway * 0.8
      player.legR.rotation.x = sway * 0.8

      // Slight body tilt based on movement
      maskGroup.rotation.z = (playerTargetX - playerX) * -0.08

      // Camera follows
      camera.position.x = playerX * 0.3
      camera.position.y = height + 2.5
      camera.position.z = 10
      camera.lookAt(playerX * 0.4, height + 5, 0)

      // Move lights
      spotMain.position.set(playerX * 0.2, height + 20, 8)
      spotMain.target.position.set(playerX * 0.3, height + 2, 0)
      spotBlue.position.set(-4, height + 25, 3)
      spotBlue.target.position.set(0, height + 5, 0)
      spotRim.position.set(2, height + 15, -5)
      spotRim.target.position.set(0, height + 3, 2)

      // Move walls to follow
      wallL.position.y = height
      wallR.position.y = height
      backWall.position.y = height

      // Glow ring pulse
      player.glowMat.opacity = 0.25 + Math.sin(now * 0.005) * 0.1

      // Background particles drift
      for (const dust of bgParticles) {
        dust.position.y += dt * 0.3
        // Recycle if too far below or above
        if (dust.position.y < height - 20) {
          dust.position.y = height + 40 + Math.random() * 20
          dust.position.x = (Math.random() - 0.5) * 10
        }
        if (dust.position.y > height + 60) {
          dust.position.y = height - 10
          dust.position.x = (Math.random() - 0.5) * 10
        }
        // Gentle sway
        dust.position.x += Math.sin(now * 0.001 + dust.position.y) * dt * 0.1
      }

      // Light beams follow
      for (const beam of lightBeams) {
        if (beam.position.y < height - 20) {
          beam.position.y = height + 30 + Math.random() * 30
          beam.position.x = (Math.random() - 0.5) * 8
        }
        ;(beam.material as THREE.MeshBasicMaterial).opacity = 0.03 + Math.sin(now * 0.002 + beam.position.x) * 0.02
      }

      // Stage check
      for (let i = currentStageIndex; i < STAGES.length; i++) {
        if (height >= STAGES[i].height && i > currentStageIndex) {
          currentStageIndex = i
          currentAct = STAGES[i].act
          updateMaskCrack()

          const colors = ACT_COLORS[currentAct]
          if (colors) {
            scene.background = new THREE.Color(colors.bg)
            ;(scene.fog as THREE.FogExp2).color.set(colors.fog)
          }

          callbacksRef.current.onStageChange(i, STAGES[i])
          break
        }
      }

      // Spawn collectibles
      if (height + 40 > lastSpawnHeight) {
        for (let y = lastSpawnHeight; y < height + 60; y += 3 + Math.random() * 3) {
          spawnCollectible(y)
        }
        lastSpawnHeight = height + 60
      }

      // Spawn obstacles
      if (height + 30 > lastObstacleHeight) {
        const gap = currentAct >= 4 ? 4 : 6
        for (let y = lastObstacleHeight; y < height + 50; y += gap + Math.random() * 6) {
          spawnObstacle(y)
        }
        lastObstacleHeight = height + 50
      }

      // Spawn platforms
      if (height + 30 > lastPlatformHeight) {
        for (let y = lastPlatformHeight; y < height + 50; y += 8 + Math.random() * 6) {
          spawnPlatform(y)
        }
        lastPlatformHeight = height + 50
      }

      // Update collectibles
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i]
        if (c.collected) continue

        // Animate
        c.mesh.rotation.y += dt * 1.5
        if (c.type === "ticket") {
          c.mesh.position.y += Math.sin(now * 0.003 + i) * dt * 0.15
        } else {
          c.mesh.rotation.x += dt * 0.8
        }

        // Magnet
        if (magnetTimer > 0 && c.type === "ticket") {
          const dx = maskGroup.position.x - c.mesh.position.x
          const dy = (maskGroup.position.y + 1) - c.mesh.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 8) {
            c.mesh.position.x += dx * 4 * dt
            c.mesh.position.y += dy * 4 * dt
          }
        }

        // Collision
        const dx = maskGroup.position.x - c.mesh.position.x
        const dy = (maskGroup.position.y + 1) - c.mesh.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 1.2) {
          c.collected = true
          scene.remove(c.mesh)

          if (c.type === "ticket") {
            combo++
            itemsCollected++
            let mult = 1
            for (const cm of COMBO_NAMES) {
              if (combo >= cm.count) mult = cm.mult
            }
            const earned = Math.round(c.points * mult)
            score += earned
            callbacksRef.current.onScoreChange(score)

            for (const cm of COMBO_NAMES) {
              if (combo === cm.count) {
                callbacksRef.current.onCombo(combo, cm.name, cm.mult)
              }
            }

            spawnParticles(c.mesh.position, ACT_COLORS[currentAct]?.accent || 0x0057FF, 10)
          } else if (c.specialType === "1up") {
            lives = Math.min(lives + 1, 5)
            callbacksRef.current.onLivesChange(lives)
            callbacksRef.current.onSpecialItem("OFF THE PLASTIC")
            spawnParticles(c.mesh.position, 0x00ffaa, 25)
          } else if (c.specialType === "magnet") {
            magnetTimer = 8
            callbacksRef.current.onSpecialItem("물 들어온다!")
            spawnParticles(c.mesh.position, 0xffaa00, 20)
          }
        }

        // Remove if far below
        if (c.mesh.position.y < height - 15) {
          c.collected = true
          scene.remove(c.mesh)
        }
      }

      // Update obstacles
      const time = now * 0.001
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i]
        if (o.collected) continue

        switch (o.pattern) {
          case "horizontal":
            o.group.position.x = o.baseX + Math.sin(time * o.speed + o.phase) * 2.5
            break
          case "pendulum":
            o.group.rotation.z = Math.sin(time * o.speed + o.phase) * 0.6
            o.group.position.x = o.baseX + Math.sin(time * o.speed + o.phase) * 2
            break
          case "vertical":
            o.group.position.y = o.baseY + Math.sin(time * o.speed + o.phase) * 1.5
            break
          case "swing":
            o.group.position.x = o.baseX + Math.sin(time * o.speed * 0.7 + o.phase) * 3
            o.group.rotation.z = Math.sin(time * o.speed + o.phase) * 0.4
            break
        }

        // Collision
        const dx = maskGroup.position.x - o.group.position.x
        const dy = (maskGroup.position.y + 0.8) - o.group.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 1.0 && invincibleTimer <= 0) {
          o.collected = true
          scene.remove(o.group)
          lives--
          combo = 0
          callbacksRef.current.onComboReset()
          callbacksRef.current.onLivesChange(lives)
          invincibleTimer = 1.5
          spawnParticles(o.group.position, 0xff2222, 15)

          // Flash mask red
          player.maskMat.emissive.set(0xff0000)
          player.maskMat.emissiveIntensity = 0.8
          setTimeout(() => {
            player.maskMat.emissive.set(0x000000)
            player.maskMat.emissiveIntensity = 0
          }, 300)

          if (lives <= 0) {
            gameOver = true
            const duration = Date.now() - startTime
            callbacksRef.current.onGameOver(score, currentStageIndex + 1, itemsCollected, duration)
            return
          }
        }

        // Remove if far below
        if (o.group.position.y < height - 20) {
          o.collected = true
          scene.remove(o.group)
        }
      }

      // Remove platforms far below
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].baseY < height - 30) {
          scene.remove(platforms[i].mesh)
          platforms.splice(i, 1)
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.mesh.position.add(p.vel)
        p.life -= dt * 2.5
        ;(p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life)
        if (p.life <= 0) {
          scene.remove(p.mesh)
          particles.splice(i, 1)
        }
      }

      // Invincibility blink
      if (invincibleTimer > 0) {
        maskGroup.visible = Math.floor(now / 80) % 2 === 0
      } else {
        maskGroup.visible = true
      }

      callbacksRef.current.onHeightChange(height)
      renderer.render(scene, camera)
    }

    animFrameId = requestAnimationFrame(animate)

    // ── Resize ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", onResize)

    // ── Cleanup ──
    const cleanup = () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("deviceorientation", handleOrientation)
      canvas.removeEventListener("touchstart", handleTouch)
      canvas.removeEventListener("click", handleTouch)
      renderer.dispose()
    }

    gameRef.current = { cleanup }
    return cleanup
  }, [])

  useEffect(() => {
    const cleanup = initGame()
    return () => {
      cleanup?.()
      gameRef.current?.cleanup()
    }
  }, [initGame])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
    />
  )
}
