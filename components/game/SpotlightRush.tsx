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

// ─── Obstacle definitions per ACT ──────────────────────────────────────────

const OBSTACLE_TEXTS: Record<number, string[]> = {
  1: ["대기만 8시간째...", "마감됐습니다", "NG! 한 번 더!"],
  2: ["동녹이니까 조용히!", "동선 다시 잡아봐", "컷! 다시!"],
  3: ["발연기", "하차해", "촬영이 이틀 땡겨졌어"],
  4: ["한마디만요!", "전속계약 분쟁...", "플래시가 쏟아진다"],
  5: ["이 나이에 아직...", "완벽해야 해", "과거가 돌아온다"],
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Collectible {
  mesh: THREE.Mesh
  type: "ticket" | "special"
  points: number
  specialType?: string
  collected: boolean
}

interface Obstacle {
  mesh: THREE.Mesh
  pattern: "horizontal" | "pendulum" | "vertical" | "chase"
  speed: number
  baseX: number
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
    let startTime = Date.now()
    let playerX = 0
    let playerTargetX = 0
    const BASE_SPEED = 0.15
    let speedMultiplier = 1
    let boostTimer = 0
    let invincibleTimer = 0
    let lastSpawnHeight = 0
    let lastObstacleHeight = 0

    const collectibles: Collectible[] = []
    const obstacles: Obstacle[] = []
    const particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = []

    // ── Renderer ──
    const isMobile = window.innerWidth <= 768
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false })
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020202)
    scene.fog = new THREE.FogExp2(0x020202, 0.035)

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
    camera.position.set(0, 2, 8)
    camera.lookAt(0, 5, 0)

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x0a0805, 2.0))

    const spotMain = new THREE.SpotLight(0xfff4e0, 3, 50, Math.PI / 6, 0.5, 1)
    spotMain.position.set(0, 15, 5)
    spotMain.target.position.set(0, 0, 0)
    scene.add(spotMain)
    scene.add(spotMain.target)

    const spotBlue = new THREE.SpotLight(0x0057FF, 2, 40, Math.PI / 5, 0.6, 1.2)
    spotBlue.position.set(-3, 20, 2)
    spotBlue.target.position.set(0, 5, 0)
    scene.add(spotBlue)
    scene.add(spotBlue.target)

    // ── Tunnel walls ──
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c0b09, roughness: 0.95, metalness: 0.04 })
    const wallH = 200
    const wallGeo = new THREE.PlaneGeometry(wallH, wallH)

    const wallL = new THREE.Mesh(wallGeo, wallMat)
    wallL.rotation.y = Math.PI / 2
    wallL.position.set(-5, wallH / 2, 0)
    scene.add(wallL)

    const wallR = new THREE.Mesh(wallGeo, wallMat.clone())
    wallR.rotation.y = -Math.PI / 2
    wallR.position.set(5, wallH / 2, 0)
    scene.add(wallR)

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, wallH), wallMat.clone())
    backWall.position.set(0, wallH / 2, -5)
    scene.add(backWall)

    // Wall trim lines (blue)
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x0057FF, opacity: 0.25, transparent: true })
    for (let y = 0; y < wallH; y += 10) {
      const trimGeo = new THREE.PlaneGeometry(0.04, 10)
      const trimL = new THREE.Mesh(trimGeo, trimMat)
      trimL.rotation.y = Math.PI / 2
      trimL.position.set(-4.97, y + 5, 0)
      scene.add(trimL)

      const trimR = new THREE.Mesh(trimGeo.clone(), trimMat)
      trimR.rotation.y = -Math.PI / 2
      trimR.position.set(4.97, y + 5, 0)
      scene.add(trimR)
    }

    // ── Player (mask character) ──
    const maskGroup = new THREE.Group()

    // Head (sphere with mask)
    const headGeo = new THREE.SphereGeometry(0.4, 16, 12)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.7, metalness: 0.1 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.4

    // Mask (front half of head)
    const maskGeo = new THREE.SphereGeometry(0.42, 16, 12, 0, Math.PI)
    const maskMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0d0,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 1,
    })
    const mask = new THREE.Mesh(maskGeo, maskMat)
    mask.position.y = 1.4
    mask.rotation.y = Math.PI

    // Body (capsule)
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.2, 1.0, 8)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.7

    // Glow ring
    const glowGeo = new THREE.RingGeometry(0.5, 0.6, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x0057FF,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.rotation.x = -Math.PI / 2
    glow.position.y = 0.05

    maskGroup.add(head, mask, body, glow)
    maskGroup.position.set(0, 0, 2)
    scene.add(maskGroup)

    // Mask crack lines (added progressively)
    const crackLines: THREE.Line[] = []
    const addCrackLine = () => {
      const points = []
      const startAngle = Math.random() * Math.PI
      const startR = 0.35
      for (let i = 0; i < 5; i++) {
        const angle = startAngle + (Math.random() - 0.5) * 0.8
        const r = startR + Math.random() * 0.08
        points.push(new THREE.Vector3(
          Math.sin(angle) * r,
          1.4 + (Math.random() - 0.5) * 0.5,
          Math.cos(angle) * r + 0.05
        ))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({ color: 0x0057FF, opacity: 0.7, transparent: true })
      const line = new THREE.Line(geo, mat)
      maskGroup.add(line)
      crackLines.push(line)
    }

    // ── Helper: spawn collectible ──
    const spawnCollectible = (y: number) => {
      const stage = STAGES[currentStageIndex] || STAGES[STAGES.length - 1]
      const x = (Math.random() - 0.5) * 7

      // Ticket
      const ticketGeo = new THREE.BoxGeometry(0.6, 0.4, 0.05)
      const stageColor = ACT_COLORS[stage.act]?.accent || 0x0057FF
      const ticketMat = new THREE.MeshStandardMaterial({
        color: stageColor,
        metalness: 0.6,
        roughness: 0.3,
        emissive: stageColor,
        emissiveIntensity: 0.3,
      })
      const ticketMesh = new THREE.Mesh(ticketGeo, ticketMat)
      ticketMesh.position.set(x, y, 2)
      scene.add(ticketMesh)

      collectibles.push({
        mesh: ticketMesh,
        type: "ticket",
        points: stage.points,
        collected: false,
      })

      // Rare: special items
      const rand = Math.random()
      if (rand < 0.05) {
        // 1UP - OFF THE PLASTIC
        const specialGeo = new THREE.SphereGeometry(0.3, 12, 8)
        const specialMat = new THREE.MeshStandardMaterial({
          color: 0x00ffaa,
          emissive: 0x00ffaa,
          emissiveIntensity: 0.5,
          metalness: 0.8,
          roughness: 0.2,
        })
        const specialMesh = new THREE.Mesh(specialGeo, specialMat)
        const sx = (Math.random() - 0.5) * 7
        specialMesh.position.set(sx, y + 3, 2)
        scene.add(specialMesh)
        collectibles.push({
          mesh: specialMesh,
          type: "special",
          points: 0,
          specialType: "1up",
          collected: false,
        })
      } else if (rand < 0.09) {
        // Magnet
        const specialGeo = new THREE.OctahedronGeometry(0.25, 0)
        const specialMat = new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          emissive: 0xffaa00,
          emissiveIntensity: 0.4,
          metalness: 0.7,
          roughness: 0.3,
        })
        const specialMesh = new THREE.Mesh(specialGeo, specialMat)
        const sx = (Math.random() - 0.5) * 7
        specialMesh.position.set(sx, y + 5, 2)
        scene.add(specialMesh)
        collectibles.push({
          mesh: specialMesh,
          type: "special",
          points: 0,
          specialType: "magnet",
          collected: false,
        })
      }
    }

    // ── Helper: spawn obstacle ──
    const spawnObstacle = (y: number) => {
      const x = (Math.random() - 0.5) * 6
      const geo = new THREE.BoxGeometry(1.2, 0.3, 0.3)
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff2222,
        emissive: 0xff0000,
        emissiveIntensity: 0.2,
        roughness: 0.6,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x, y, 2)
      scene.add(mesh)

      const patterns: Obstacle["pattern"][] = ["horizontal", "pendulum", "vertical"]
      obstacles.push({
        mesh,
        pattern: patterns[Math.floor(Math.random() * patterns.length)],
        speed: 0.5 + Math.random() * 1.5,
        baseX: x,
        phase: Math.random() * Math.PI * 2,
        collected: false,
      })
    }

    // ── Helper: spawn particles ──
    const spawnParticles = (pos: THREE.Vector3, color: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(0.04, 4, 4)
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.copy(pos)
        scene.add(mesh)
        particles.push({
          mesh,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.15 + 0.05,
            (Math.random() - 0.5) * 0.1
          ),
          life: 1,
        })
      }
    }

    // ── Helper: update mask crack level ──
    const updateMaskCrack = () => {
      // 0~19 stages → crack progress 0~1
      const progress = currentStageIndex / (STAGES.length - 1)
      maskMat.opacity = 1 - progress * 0.9
      // Add crack lines at certain thresholds
      const targetCracks = Math.floor(progress * 15)
      while (crackLines.length < targetCracks) {
        addCrackLine()
      }
    }

    // ── Input handling ──
    let tiltX = 0
    let magnetTimer = 0
    let useGyro = false

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        useGyro = true
        tiltX = (e.gamma / 45) * 4 // map ±45° to ±4
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") playerTargetX = Math.max(-4, playerTargetX - 0.5)
      if (e.key === "ArrowRight") playerTargetX = Math.min(4, playerTargetX + 0.5)
      if (e.key === " " || e.key === "Enter") boostTimer = 0.5
    }

    const handleTouch = () => {
      boostTimer = 0.5
    }

    // Request gyro permission on iOS
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

      // Speed increases with height
      speedMultiplier = 1 + height * 0.0003
      const currentSpeed = BASE_SPEED * speedMultiplier * (boostTimer > 0 ? 2.5 : 1)
      height += currentSpeed * 60 * dt

      // Boost timer
      if (boostTimer > 0) boostTimer -= dt

      // Invincibility timer
      if (invincibleTimer > 0) invincibleTimer -= dt

      // Magnet timer
      if (magnetTimer > 0) magnetTimer -= dt

      // Player movement
      if (useGyro) {
        playerTargetX = THREE.MathUtils.clamp(tiltX, -4, 4)
      }
      playerX += (playerTargetX - playerX) * 8 * dt

      // Update player position
      maskGroup.position.x = playerX
      maskGroup.position.y = height

      // Camera follows player
      camera.position.x = playerX * 0.3
      camera.position.y = height + 2
      camera.lookAt(playerX * 0.5, height + 5, 0)

      // Move lights with player
      spotMain.position.y = height + 15
      spotMain.target.position.y = height
      spotBlue.position.y = height + 20
      spotBlue.target.position.y = height + 5

      // Move walls to follow
      wallL.position.y = height
      wallR.position.y = height
      backWall.position.y = height

      // Update glow ring pulse
      glow.material.opacity = 0.2 + Math.sin(now * 0.005) * 0.1

      // Stage check
      for (let i = currentStageIndex; i < STAGES.length; i++) {
        if (height >= STAGES[i].height && i > currentStageIndex) {
          currentStageIndex = i
          currentAct = STAGES[i].act
          updateMaskCrack()

          // Update scene colors
          const colors = ACT_COLORS[currentAct]
          if (colors) {
            scene.background = new THREE.Color(colors.bg)
            ;(scene.fog as THREE.FogExp2).color.set(colors.fog)
          }

          callbacksRef.current.onStageChange(i, STAGES[i])
          break
        }
      }

      // Spawn new collectibles ahead
      if (height + 40 > lastSpawnHeight) {
        for (let y = lastSpawnHeight; y < height + 60; y += 3 + Math.random() * 3) {
          spawnCollectible(y)
        }
        lastSpawnHeight = height + 60
      }

      // Spawn new obstacles ahead
      if (height + 30 > lastObstacleHeight) {
        const obstacleGap = currentAct >= 4 ? 4 : 6
        for (let y = lastObstacleHeight; y < height + 50; y += obstacleGap + Math.random() * 6) {
          spawnObstacle(y)
        }
        lastObstacleHeight = height + 50
      }

      // Update collectibles
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i]
        if (c.collected) continue

        // Rotate tickets
        c.mesh.rotation.y += dt * 2
        c.mesh.rotation.z = Math.sin(now * 0.003 + i) * 0.2

        // Magnet effect
        if (magnetTimer > 0 && c.type === "ticket") {
          const dx = maskGroup.position.x - c.mesh.position.x
          const dy = maskGroup.position.y - c.mesh.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 6) {
            c.mesh.position.x += dx * 3 * dt
            c.mesh.position.y += dy * 3 * dt
          }
        }

        // Collision check
        const dx = maskGroup.position.x - c.mesh.position.x
        const dy = maskGroup.position.y + 1 - c.mesh.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 1.0) {
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

            // Check combo milestone
            for (const cm of COMBO_NAMES) {
              if (combo === cm.count) {
                callbacksRef.current.onCombo(combo, cm.name, cm.mult)
              }
            }

            spawnParticles(c.mesh.position, ACT_COLORS[currentAct]?.accent || 0x0057FF, 8)
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

        // Remove if far below
        if (c.mesh.position.y < height - 10) {
          c.collected = true
          scene.remove(c.mesh)
        }
      }

      // Update obstacles
      const time = now * 0.001
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i]
        if (o.collected) continue

        // Animate
        switch (o.pattern) {
          case "horizontal":
            o.mesh.position.x = o.baseX + Math.sin(time * o.speed + o.phase) * 2
            break
          case "pendulum":
            o.mesh.rotation.z = Math.sin(time * o.speed + o.phase) * 0.8
            o.mesh.position.x = o.baseX + Math.sin(time * o.speed + o.phase) * 1.5
            break
          case "vertical":
            o.mesh.position.y += Math.sin(time * o.speed + o.phase) * dt * 0.5
            break
        }

        // Collision check
        const dx = maskGroup.position.x - o.mesh.position.x
        const dy = maskGroup.position.y + 0.8 - o.mesh.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 1.0 && invincibleTimer <= 0) {
          o.collected = true
          scene.remove(o.mesh)
          lives--
          combo = 0
          callbacksRef.current.onComboReset()
          callbacksRef.current.onLivesChange(lives)
          invincibleTimer = 1.5
          spawnParticles(o.mesh.position, 0xff2222, 12)

          // Flash mask red briefly
          maskMat.emissive.set(0xff0000)
          maskMat.emissiveIntensity = 0.5
          setTimeout(() => {
            maskMat.emissive.set(0x000000)
            maskMat.emissiveIntensity = 0
          }, 300)

          if (lives <= 0) {
            gameOver = true
            const duration = Date.now() - startTime
            callbacksRef.current.onGameOver(score, currentStageIndex + 1, itemsCollected, duration)
            return
          }
        }

        // Remove if far below
        if (o.mesh.position.y < height - 15) {
          o.collected = true
          scene.remove(o.mesh)
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.mesh.position.add(p.vel)
        p.life -= dt * 2
        ;(p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life)
        if (p.life <= 0) {
          scene.remove(p.mesh)
          particles.splice(i, 1)
        }
      }

      // Invincibility blink
      if (invincibleTimer > 0) {
        maskGroup.visible = Math.floor(now / 100) % 2 === 0
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
