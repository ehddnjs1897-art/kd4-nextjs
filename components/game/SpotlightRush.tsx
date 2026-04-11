"use client"

import * as THREE from "three"
import { useEffect, useRef, useCallback } from "react"

// ─── Stage Data ──────────────────────────────────────────────────────────────

const STAGES = [
  { height: 0,    title: "무명의 메모",       sub: '"이름 없는 누군가에게"',        points: 3,   act: 1 },
  { height: 50,   title: "오디션 번호표",     sub: '"342번, 들어오세요"',            points: 5,   act: 1 },
  { height: 120,  title: "엑스트라 콜시트",   sub: '"배경 오른쪽, 지나가세요"',      points: 7,   act: 1 },
  { height: 200,  title: "단편의 사이드",     sub: '"이 대본, 한번 읽어볼래요?"',    points: 10,  act: 1 },
  { height: 300,  title: "독립영화 러브콜",   sub: '"당신만의 색이 보여요"',          points: 13,  act: 2 },
  { height: 450,  title: "첫 대사 한 줄",     sub: '"레디... 액션!"',                points: 16,  act: 2 },
  { height: 600,  title: "콜백 통보",         sub: '"2차 오디션 오세요"',             points: 20,  act: 2 },
  { height: 800,  title: "크랭크인 소식",     sub: '"다음 주 촬영 시작합니다"',       points: 25,  act: 2 },
  { height: 1000, title: "안방극장의 얼굴",   sub: '"본방사수할게!"',                points: 30,  act: 3 },
  { height: 1300, title: "첫 팬레터",         sub: '"언니/오빠 응원해요"',            points: 35,  act: 3 },
  { height: 1600, title: "주연 캐스팅 확정",  sub: '"이 작품의 중심은 당신"',         points: 40,  act: 3 },
  { height: 2000, title: "천만 관객 티켓",    sub: '"극장이 당신으로 찼다"',          points: 50,  act: 3 },
  { height: 2500, title: "레드카펫 패스",     sub: '"플래시가 쏟아진다"',             points: 60,  act: 4 },
  { height: 3000, title: "해외 배급 계약서",  sub: '"전 세계가 기다립니다"',           points: 70,  act: 4 },
  { height: 3500, title: "영화제 초청장",     sub: '"공식 경쟁부문 초청"',            points: 85,  act: 4 },
  { height: 4000, title: "트로피 각인",       sub: '"그리고 수상자는..."',            points: 100, act: 4 },
  { height: 5000, title: "거장의 지명",       sub: '"다음 작품, 당신이어야 해"',      points: 130, act: 5 },
  { height: 6000, title: "마스터클래스 초대",  sub: '"이제 가르칠 차례입니다"',        points: 160, act: 5 },
  { height: 7500, title: "전설의 크레딧",     sub: '"역사에 이름을 새기다"',          points: 200, act: 5 },
  { height: 10000,title: "OFF THE PLASTIC",   sub: '"가면은 필요 없다"',             points: 500, act: 5 },
]

// Sky gradient colors per ACT (dark noir → gradually shifts)
const ACT_SKY: Record<number, { top: number; bottom: number; fog: number; accent: number }> = {
  1: { top: 0x000005, bottom: 0x050520, fog: 0x020210, accent: 0x0057FF },
  2: { top: 0x000008, bottom: 0x0a0830, fog: 0x030318, accent: 0x0066FF },
  3: { top: 0x02000a, bottom: 0x100840, fog: 0x050520, accent: 0x1177FF },
  4: { top: 0x05000f, bottom: 0x180850, fog: 0x080528, accent: 0x3388FF },
  5: { top: 0x080015, bottom: 0x200860, fog: 0x0a0830, accent: 0x55aaFF },
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
  mesh: THREE.Group
  type: "ticket" | "special"
  points: number
  specialType?: string
  collected: boolean
}

interface Obstacle {
  mesh: THREE.Group
  pattern: "horizontal" | "pendulum" | "orbit"
  speed: number
  baseX: number
  baseY: number
  baseZ: number
  phase: number
  collected: boolean
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

// ─── Low-poly PS1-style character ────────────────────────────────────────────

function createCharacter() {
  const group = new THREE.Group()
  const bodyColor = 0x0a0a0a
  const mat = new THREE.MeshLambertMaterial({ color: bodyColor, flatShading: true })

  // Head — faceted sphere (low segment count for PS1 feel)
  const headGeo = new THREE.IcosahedronGeometry(0.28, 1)
  const head = new THREE.Mesh(headGeo, mat)
  head.position.y = 1.75
  group.add(head)

  // Mask — front face cover (glossy white, cracks over time)
  const maskGeo = new THREE.IcosahedronGeometry(0.30, 1)
  // Keep only front-facing triangles by using a half-sphere approach
  const maskMat = new THREE.MeshPhongMaterial({
    color: 0xeee8d8,
    flatShading: true,
    shininess: 80,
    transparent: true,
    opacity: 1,
  })
  const mask = new THREE.Mesh(maskGeo, maskMat)
  mask.position.y = 1.75
  mask.scale.set(1.02, 1.02, 0.5)
  mask.position.z = 0.1
  group.add(mask)

  // Torso — blocky box
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.3)
  const torso = new THREE.Mesh(torsoGeo, mat)
  torso.position.y = 1.2
  group.add(torso)

  // Arms — thin boxes
  const armGeo = new THREE.BoxGeometry(0.14, 0.55, 0.14)
  const armL = new THREE.Mesh(armGeo, mat)
  armL.position.set(-0.35, 1.15, 0)
  group.add(armL)
  const armR = new THREE.Mesh(armGeo, mat.clone())
  armR.position.set(0.35, 1.15, 0)
  group.add(armR)

  // Legs — thin boxes
  const legGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16)
  const legL = new THREE.Mesh(legGeo, mat.clone())
  legL.position.set(-0.14, 0.5, 0)
  group.add(legL)
  const legR = new THREE.Mesh(legGeo, mat.clone())
  legR.position.set(0.14, 0.5, 0)
  group.add(legR)

  // Subtle glow underneath (spotlight effect)
  const glowGeo = new THREE.CircleGeometry(0.6, 8)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x0057FF,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  })
  const glowDisc = new THREE.Mesh(glowGeo, glowMat)
  glowDisc.rotation.x = -Math.PI / 2
  glowDisc.position.y = 0.1
  group.add(glowDisc)

  return { group, maskMat, glowMat, armL, armR, legL, legR }
}

// ─── Create a floating collectible ticket ────────────────────────────────────

function createTicketCollectible(color: number): THREE.Group {
  const group = new THREE.Group()

  // Glowing diamond/crystal shape — NOT a flat box
  const crystalGeo = new THREE.OctahedronGeometry(0.3, 0)
  const crystalMat = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    flatShading: true,
    shininess: 100,
    transparent: true,
    opacity: 0.9,
  })
  const crystal = new THREE.Mesh(crystalGeo, crystalMat)
  group.add(crystal)

  // Outer glow ring
  const ringGeo = new THREE.RingGeometry(0.35, 0.42, 6)
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  group.add(ring)

  return group
}

// ─── Create obstacle (boom mic / light rig) ──────────────────────────────────

function createObstacleGroup(): THREE.Group {
  const group = new THREE.Group()
  const dangerMat = new THREE.MeshLambertMaterial({ color: 0x331111, flatShading: true })
  const redMat = new THREE.MeshPhongMaterial({
    color: 0xff2222,
    emissive: 0xff0000,
    emissiveIntensity: 0.25,
    flatShading: true,
  })

  // Cross-beam (boom mic shape)
  const beamGeo = new THREE.BoxGeometry(2.0, 0.1, 0.1)
  group.add(new THREE.Mesh(beamGeo, dangerMat))

  // Red warning nodes at ends
  const nodeGeo = new THREE.IcosahedronGeometry(0.15, 0)
  const nodeL = new THREE.Mesh(nodeGeo, redMat)
  nodeL.position.set(-0.9, 0, 0)
  group.add(nodeL)
  const nodeR = new THREE.Mesh(nodeGeo, redMat.clone())
  nodeR.position.set(0.9, 0, 0)
  group.add(nodeR)

  // Danger glow
  const glowGeo = new THREE.PlaneGeometry(2.4, 0.6)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
  })
  group.add(new THREE.Mesh(glowGeo, glowMat))

  return group
}

// ─── Sky gradient background ─────────────────────────────────────────────────

function createSkyGradient(topColor: number, bottomColor: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(2, 2)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTopColor: { value: new THREE.Color(topColor) },
      uBottomColor: { value: new THREE.Color(bottomColor) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.999, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(mix(uBottomColor, uTopColor, vUv.y), 1.0);
      }
    `,
    depthWrite: false,
    depthTest: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.renderOrder = -1
  mesh.frustumCulled = false
  return mesh
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
    let playerZ = 0
    let playerTargetX = 0
    let playerTargetZ = 0
    const BASE_SPEED = 0.15
    let speedMultiplier = 1
    let boostTimer = 0
    let invincibleTimer = 0
    let lastSpawnHeight = 0
    let lastObstacleHeight = 0
    let magnetTimer = 0
    let tiltX = 0
    let tiltZ = 0
    let useGyro = false

    const collectibles: Collectible[] = []
    const obstacles: Obstacle[] = []
    const particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = []
    const floatingDebris: { mesh: THREE.Mesh; speed: number; rotSpeed: THREE.Vector3 }[] = []

    // ── Renderer ──
    const isMobile = window.innerWidth <= 768
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false })
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.7

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020210, 0.012)

    // ── Sky gradient (rendered as background) ──
    const skyMesh = createSkyGradient(0x000005, 0x050520)
    scene.add(skyMesh)

    // ── Camera — BEHIND and slightly BELOW character, looking UP ──
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300)
    // Camera will be positioned dynamically in the loop

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x111125, 1.0))

    // Main spotlight from above (the "spotlight" they're ascending toward)
    const spotAbove = new THREE.SpotLight(0xfff8ee, 5, 100, Math.PI / 8, 0.7, 0.8)
    spotAbove.position.set(0, 50, 0)
    scene.add(spotAbove)
    scene.add(spotAbove.target)

    // Blue fill light from side
    const fillLight = new THREE.DirectionalLight(0x0044aa, 0.8)
    fillLight.position.set(-5, 10, 3)
    scene.add(fillLight)

    // Warm rim light
    const rimLight = new THREE.DirectionalLight(0x553322, 0.4)
    rimLight.position.set(3, -5, -3)
    scene.add(rimLight)

    // ── Floating debris (atmospheric — tiny fragments floating in the void) ──
    const debrisMat = new THREE.MeshLambertMaterial({ color: 0x111122, flatShading: true })
    for (let i = 0; i < 60; i++) {
      const size = 0.05 + Math.random() * 0.15
      const geo = Math.random() > 0.5
        ? new THREE.BoxGeometry(size, size, size)
        : new THREE.TetrahedronGeometry(size, 0)
      const mesh = new THREE.Mesh(geo, debrisMat.clone())
      mesh.position.set(
        (Math.random() - 0.5) * 30,
        Math.random() * 80,
        (Math.random() - 0.5) * 20 - 5
      )
      scene.add(mesh)
      floatingDebris.push({
        mesh,
        speed: 0.2 + Math.random() * 0.5,
        rotSpeed: new THREE.Vector3(
          Math.random() * 0.5,
          Math.random() * 0.5,
          Math.random() * 0.3
        ),
      })
    }

    // ── Distant vertical light beams (like searchlights in the void) ──
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x0057FF,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
    })
    const beams: THREE.Mesh[] = []
    for (let i = 0; i < 5; i++) {
      const beamGeo = new THREE.PlaneGeometry(0.3, 80)
      const beam = new THREE.Mesh(beamGeo, beamMat.clone())
      beam.position.set(
        (Math.random() - 0.5) * 25,
        Math.random() * 50,
        -8 - Math.random() * 10
      )
      beam.rotation.y = Math.random() * 0.5
      scene.add(beam)
      beams.push(beam)
    }

    // ── Player character ──
    const player = createCharacter()
    const charGroup = player.group
    charGroup.position.set(0, 0, 0)
    scene.add(charGroup)

    // Crack lines
    const crackLines: THREE.Line[] = []
    const addCrackLine = () => {
      const pts: THREE.Vector3[] = []
      const startAngle = Math.random() * Math.PI * 2
      for (let i = 0; i < 5; i++) {
        const a = startAngle + (Math.random() - 0.5) * 1.2
        const r = 0.25 + Math.random() * 0.08
        pts.push(new THREE.Vector3(
          Math.sin(a) * r * 0.5 + 0.1,
          1.75 + (Math.random() - 0.5) * 0.25,
          Math.cos(a) * r * 0.3 + 0.1
        ))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({ color: 0x0057FF, transparent: true, opacity: 0.7 })
      const line = new THREE.Line(geo, mat)
      charGroup.add(line)
      crackLines.push(line)
    }

    // ── Spawn helpers ──

    const spawnCollectible = (y: number) => {
      const stage = STAGES[currentStageIndex] || STAGES[STAGES.length - 1]
      const x = (Math.random() - 0.5) * 12
      const z = (Math.random() - 0.5) * 8

      const color = ACT_SKY[stage.act]?.accent || 0x0057FF
      const ticket = createTicketCollectible(color)
      ticket.position.set(x, y, z)
      scene.add(ticket)
      collectibles.push({ mesh: ticket, type: "ticket", points: stage.points, collected: false })

      // Rare specials
      const rand = Math.random()
      if (rand < 0.05) {
        const g = new THREE.Group()
        const geo = new THREE.IcosahedronGeometry(0.35, 1)
        const mat = new THREE.MeshPhongMaterial({
          color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 0.6,
          flatShading: true, transparent: true, opacity: 0.85,
        })
        g.add(new THREE.Mesh(geo, mat))
        // Inner bright core
        const inner = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.15, 0),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
        )
        g.add(inner)
        const sx = (Math.random() - 0.5) * 12
        const sz = (Math.random() - 0.5) * 8
        g.position.set(sx, y + 3, sz)
        scene.add(g)
        collectibles.push({ mesh: g, type: "special", points: 0, specialType: "1up", collected: false })
      } else if (rand < 0.09) {
        const g = new THREE.Group()
        const geo = new THREE.OctahedronGeometry(0.28, 0)
        const mat = new THREE.MeshPhongMaterial({
          color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.5,
          flatShading: true,
        })
        g.add(new THREE.Mesh(geo, mat))
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.4, 0.03, 6, 12),
          new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.4 })
        )
        ring.rotation.x = Math.PI / 2
        g.add(ring)
        const sx = (Math.random() - 0.5) * 12
        const sz = (Math.random() - 0.5) * 8
        g.position.set(sx, y + 5, sz)
        scene.add(g)
        collectibles.push({ mesh: g, type: "special", points: 0, specialType: "magnet", collected: false })
      }
    }

    const spawnObstacle = (y: number) => {
      const x = (Math.random() - 0.5) * 10
      const z = (Math.random() - 0.5) * 6
      const obs = createObstacleGroup()
      obs.position.set(x, y, z)
      scene.add(obs)

      const patterns: Obstacle["pattern"][] = ["horizontal", "pendulum", "orbit"]
      obstacles.push({
        mesh: obs,
        pattern: patterns[Math.floor(Math.random() * patterns.length)],
        speed: 0.4 + Math.random() * 1.2,
        baseX: x, baseY: y, baseZ: z,
        phase: Math.random() * Math.PI * 2,
        collected: false,
      })
    }

    const spawnParticles = (pos: THREE.Vector3, color: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const s = 0.03 + Math.random() * 0.05
        const geo = new THREE.TetrahedronGeometry(s, 0)
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.copy(pos)
        scene.add(mesh)
        particles.push({
          mesh,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.3) * 0.3,
            (Math.random() - 0.5) * 0.4
          ),
          life: 1,
        })
      }
    }

    const updateMaskCrack = () => {
      const progress = currentStageIndex / (STAGES.length - 1)
      player.maskMat.opacity = 1 - progress * 0.95
      const targetCracks = Math.floor(progress * 16)
      while (crackLines.length < targetCracks) addCrackLine()
    }

    // ── Input ──
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        useGyro = true
        tiltX = (e.gamma / 40) * 6
        tiltZ = ((e.beta - 45) / 40) * 4 // forward/back tilt
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") playerTargetX = Math.max(-6, playerTargetX - 0.6)
      if (e.key === "ArrowRight") playerTargetX = Math.min(6, playerTargetX + 0.6)
      if (e.key === "ArrowUp") playerTargetZ = Math.max(-4, playerTargetZ - 0.5)
      if (e.key === "ArrowDown") playerTargetZ = Math.min(4, playerTargetZ + 0.5)
      if (e.key === " " || e.key === "Enter") boostTimer = 0.5
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // Gradually return to center
      }
    }

    const handleTouch = () => { boostTimer = 0.5 }

    const requestGyro = async () => {
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof DOE.requestPermission === "function") {
        try {
          const perm = await DOE.requestPermission()
          if (perm === "granted") window.addEventListener("deviceorientation", handleOrientation)
        } catch { /* keyboard fallback */ }
      } else {
        window.addEventListener("deviceorientation", handleOrientation)
      }
    }

    requestGyro()
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    canvas.addEventListener("touchstart", handleTouch, { passive: true })
    canvas.addEventListener("click", handleTouch)

    // ── Initial spawns ──
    for (let y = 5; y < 60; y += 2.5 + Math.random() * 3) spawnCollectible(y)
    for (let y = 10; y < 60; y += 7 + Math.random() * 8) spawnObstacle(y)
    lastSpawnHeight = 60
    lastObstacleHeight = 60

    // ── Animation loop ──
    let animFrameId: number
    let lastTime = performance.now()

    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate)
      if (gameOver) return

      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      const t = now * 0.001

      // Speed increases with height
      speedMultiplier = 1 + height * 0.0003
      const currentSpeed = BASE_SPEED * speedMultiplier * (boostTimer > 0 ? 2.5 : 1)
      height += currentSpeed * 60 * dt

      if (boostTimer > 0) boostTimer -= dt
      if (invincibleTimer > 0) invincibleTimer -= dt
      if (magnetTimer > 0) magnetTimer -= dt

      // Player movement (XZ plane)
      if (useGyro) {
        playerTargetX = THREE.MathUtils.clamp(tiltX, -6, 6)
        playerTargetZ = THREE.MathUtils.clamp(tiltZ, -4, 4)
      }
      playerX += (playerTargetX - playerX) * 6 * dt
      playerZ += (playerTargetZ - playerZ) * 6 * dt

      // Update character
      charGroup.position.set(playerX, height, playerZ)

      // Character animation — running/flying motion
      const runCycle = Math.sin(now * 0.008) * 0.25
      player.armL.rotation.x = runCycle
      player.armR.rotation.x = -runCycle
      player.legL.rotation.x = -runCycle * 0.6
      player.legR.rotation.x = runCycle * 0.6

      // Lean into movement direction
      charGroup.rotation.z = (playerTargetX - playerX) * -0.06
      charGroup.rotation.x = (playerTargetZ - playerZ) * 0.04

      // Glow pulse
      player.glowMat.opacity = 0.1 + Math.sin(now * 0.004) * 0.08

      // ── Camera — behind and below, looking up ──
      const camTargetX = playerX * 0.4
      const camTargetY = height - 1.5
      const camTargetZ = playerZ + 12
      camera.position.x += (camTargetX - camera.position.x) * 4 * dt
      camera.position.y += (camTargetY - camera.position.y) * 4 * dt
      camera.position.z += (camTargetZ - camera.position.z) * 4 * dt
      camera.lookAt(playerX * 0.3, height + 6, playerZ - 5)

      // ── Lights follow ──
      spotAbove.position.set(playerX * 0.2, height + 40, playerZ)
      spotAbove.target.position.set(playerX, height, playerZ)
      fillLight.position.set(playerX - 8, height + 10, playerZ + 5)
      rimLight.position.set(playerX + 5, height - 5, playerZ - 5)

      // ── Update sky gradient to shift with ACT ──
      const sky = ACT_SKY[currentAct]
      if (sky) {
        const skyUniforms = (skyMesh.material as THREE.ShaderMaterial).uniforms
        const targetTop = new THREE.Color(sky.top)
        const targetBottom = new THREE.Color(sky.bottom)
        ;(skyUniforms.uTopColor.value as THREE.Color).lerp(targetTop, dt * 2)
        ;(skyUniforms.uBottomColor.value as THREE.Color).lerp(targetBottom, dt * 2)
        ;(scene.fog as THREE.FogExp2).color.lerp(new THREE.Color(sky.fog), dt * 2)
      }

      // ── Floating debris ──
      for (const d of floatingDebris) {
        d.mesh.rotation.x += d.rotSpeed.x * dt
        d.mesh.rotation.y += d.rotSpeed.y * dt
        // Recycle
        if (d.mesh.position.y < height - 30) {
          d.mesh.position.y = height + 50 + Math.random() * 30
          d.mesh.position.x = (Math.random() - 0.5) * 30
          d.mesh.position.z = (Math.random() - 0.5) * 20 - 5
        }
        if (d.mesh.position.y > height + 80) {
          d.mesh.position.y = height - 20
        }
        d.mesh.position.x += Math.sin(t * 0.3 + d.mesh.position.y * 0.1) * dt * 0.2
      }

      // Light beams follow
      for (const b of beams) {
        if (b.position.y < height - 50) {
          b.position.y = height + 40 + Math.random() * 40
          b.position.x = (Math.random() - 0.5) * 25
        }
        ;(b.material as THREE.MeshBasicMaterial).opacity = 0.02 + Math.sin(t + b.position.x) * 0.015
      }

      // ── Stage check ──
      for (let i = currentStageIndex; i < STAGES.length; i++) {
        if (height >= STAGES[i].height && i > currentStageIndex) {
          currentStageIndex = i
          currentAct = STAGES[i].act
          updateMaskCrack()
          callbacksRef.current.onStageChange(i, STAGES[i])
          break
        }
      }

      // ── Spawn ahead ──
      if (height + 40 > lastSpawnHeight) {
        for (let y = lastSpawnHeight; y < height + 60; y += 2.5 + Math.random() * 3) spawnCollectible(y)
        lastSpawnHeight = height + 60
      }
      if (height + 30 > lastObstacleHeight) {
        const gap = currentAct >= 4 ? 5 : 7
        for (let y = lastObstacleHeight; y < height + 50; y += gap + Math.random() * 6) spawnObstacle(y)
        lastObstacleHeight = height + 50
      }

      // ── Update collectibles ──
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i]
        if (c.collected) continue

        c.mesh.rotation.y += dt * 2
        if (c.type === "special") c.mesh.rotation.x += dt * 0.8
        // Bob up/down
        c.mesh.position.y += Math.sin(t * 2 + i * 0.7) * dt * 0.12

        // Magnet
        if (magnetTimer > 0 && c.type === "ticket") {
          const dx = charGroup.position.x - c.mesh.position.x
          const dy = (charGroup.position.y + 1) - c.mesh.position.y
          const dz = charGroup.position.z - c.mesh.position.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < 10) {
            c.mesh.position.x += dx * 3 * dt
            c.mesh.position.y += dy * 3 * dt
            c.mesh.position.z += dz * 3 * dt
          }
        }

        // Collision (3D distance)
        const dx = charGroup.position.x - c.mesh.position.x
        const dy = (charGroup.position.y + 1) - c.mesh.position.y
        const dz = charGroup.position.z - c.mesh.position.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist < 1.5) {
          c.collected = true
          scene.remove(c.mesh)

          if (c.type === "ticket") {
            combo++
            itemsCollected++
            let mult = 1
            for (const cm of COMBO_NAMES) { if (combo >= cm.count) mult = cm.mult }
            score += Math.round(c.points * mult)
            callbacksRef.current.onScoreChange(score)
            for (const cm of COMBO_NAMES) {
              if (combo === cm.count) callbacksRef.current.onCombo(combo, cm.name, cm.mult)
            }
            spawnParticles(c.mesh.position, ACT_SKY[currentAct]?.accent || 0x0057FF, 8)
          } else if (c.specialType === "1up") {
            lives = Math.min(lives + 1, 5)
            callbacksRef.current.onLivesChange(lives)
            callbacksRef.current.onSpecialItem("OFF THE PLASTIC")
            spawnParticles(c.mesh.position, 0x00ffaa, 20)
          } else if (c.specialType === "magnet") {
            magnetTimer = 8
            callbacksRef.current.onSpecialItem("물 들어온다!")
            spawnParticles(c.mesh.position, 0xffaa00, 15)
          }
        }

        if (c.mesh.position.y < height - 20) {
          c.collected = true
          scene.remove(c.mesh)
        }
      }

      // ── Update obstacles ──
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i]
        if (o.collected) continue

        switch (o.pattern) {
          case "horizontal":
            o.mesh.position.x = o.baseX + Math.sin(t * o.speed + o.phase) * 3
            break
          case "pendulum":
            o.mesh.rotation.z = Math.sin(t * o.speed + o.phase) * 0.7
            o.mesh.position.x = o.baseX + Math.sin(t * o.speed + o.phase) * 2
            break
          case "orbit":
            o.mesh.position.x = o.baseX + Math.cos(t * o.speed + o.phase) * 2.5
            o.mesh.position.z = o.baseZ + Math.sin(t * o.speed + o.phase) * 2
            o.mesh.rotation.y = t * o.speed
            break
        }

        const dx = charGroup.position.x - o.mesh.position.x
        const dy = (charGroup.position.y + 0.8) - o.mesh.position.y
        const dz = charGroup.position.z - o.mesh.position.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist < 1.2 && invincibleTimer <= 0) {
          o.collected = true
          scene.remove(o.mesh)
          lives--
          combo = 0
          callbacksRef.current.onComboReset()
          callbacksRef.current.onLivesChange(lives)
          invincibleTimer = 1.5
          spawnParticles(o.mesh.position, 0xff2222, 12)

          player.maskMat.emissive.set(0xff0000)
          player.maskMat.emissiveIntensity = 0.8
          setTimeout(() => {
            player.maskMat.emissive.set(0x000000)
            player.maskMat.emissiveIntensity = 0
          }, 300)

          if (lives <= 0) {
            gameOver = true
            callbacksRef.current.onGameOver(score, currentStageIndex + 1, itemsCollected, Date.now() - startTime)
            return
          }
        }

        if (o.mesh.position.y < height - 25) {
          o.collected = true
          scene.remove(o.mesh)
        }
      }

      // ── Update particles ──
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
        charGroup.visible = Math.floor(now / 80) % 2 === 0
      } else {
        charGroup.visible = true
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
      window.removeEventListener("keyup", handleKeyUp)
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
