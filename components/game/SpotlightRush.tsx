"use client"

import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { useEffect, useRef, useCallback } from "react"

// ─── Stage Data ───────────────────────────────────────────────────────────────
const STAGES = [
  { dist: 0,    title: "무명의 메모",      sub: '"이름 없는 누군가에게"',       points: 3,   act: 1 },
  { dist: 150,  title: "오디션 번호표",    sub: '"342번, 들어오세요"',           points: 5,   act: 1 },
  { dist: 350,  title: "엑스트라 콜시트",  sub: '"배경 오른쪽, 지나가세요"',     points: 7,   act: 1 },
  { dist: 600,  title: "단편의 사이드",    sub: '"이 대본, 한번 읽어볼래요?"',   points: 10,  act: 1 },
  { dist: 900,  title: "독립영화 러브콜",  sub: '"당신만의 색이 보여요"',         points: 13,  act: 2 },
  { dist: 1200, title: "첫 대사 한 줄",    sub: '"레디... 액션!"',               points: 16,  act: 2 },
  { dist: 1600, title: "콜백 통보",        sub: '"2차 오디션 오세요"',            points: 20,  act: 2 },
  { dist: 2100, title: "크랭크인 소식",    sub: '"다음 주 촬영 시작합니다"',      points: 25,  act: 2 },
  { dist: 2700, title: "안방극장의 얼굴",  sub: '"본방사수할게!"',               points: 30,  act: 3 },
  { dist: 3400, title: "첫 팬레터",        sub: '"언니/오빠 응원해요"',           points: 35,  act: 3 },
  { dist: 4200, title: "주연 캐스팅 확정", sub: '"이 작품의 중심은 당신"',        points: 40,  act: 3 },
  { dist: 5200, title: "천만 관객 티켓",   sub: '"극장이 당신으로 찼다"',         points: 50,  act: 3 },
  { dist: 6300, title: "레드카펫 패스",    sub: '"플래시가 쏟아진다"',            points: 60,  act: 4 },
  { dist: 7600, title: "해외 배급 계약서", sub: '"전 세계가 기다립니다"',          points: 70,  act: 4 },
  { dist: 9000, title: "영화제 초청장",    sub: '"공식 경쟁부문 초청"',           points: 85,  act: 4 },
  { dist: 10500,title: "트로피 각인",      sub: '"그리고 수상자는..."',           points: 100, act: 4 },
  { dist: 12500,title: "거장의 지명",      sub: '"다음 작품, 당신이어야 해"',     points: 130, act: 5 },
  { dist: 15000,title: "마스터클래스 초대",sub: '"이제 가르칠 차례입니다"',       points: 160, act: 5 },
  { dist: 18000,title: "전설의 크레딧",    sub: '"역사에 이름을 새기다"',         points: 200, act: 5 },
  { dist: 22000,title: "OFF THE PLASTIC",  sub: '"가면은 필요 없다"',            points: 500, act: 5 },
]

const LANES = [-3.5, 0, 3.5]

const ACT_CFG: Record<number, { fog: number; accent: number; floorEmit: number }> = {
  1: { fog: 0x000510, accent: 0x0088ff, floorEmit: 0x001133 },
  2: { fog: 0x000818, accent: 0x00aaff, floorEmit: 0x001844 },
  3: { fog: 0x000c20, accent: 0x44ccff, floorEmit: 0x002050 },
  4: { fog: 0x050010, accent: 0x8844ff, floorEmit: 0x140028 },
  5: { fog: 0x080015, accent: 0xaaeeff, floorEmit: 0x1a0040 },
}

const COMBO_NAMES = [
  { count: 3,  name: "대본리딩", mult: 1.5 },
  { count: 5,  name: "리허설",   mult: 2.0 },
  { count: 10, name: "본촬",     mult: 3.0 },
  { count: 15, name: "원테이크", mult: 4.0 },
  { count: 20, name: "명연기",   mult: 5.0 },
]

// ─── Sound Manager ───────────────────────────────────────────────────────────
class SoundManager {
  private ctx: AudioContext | null = null
  private buffers: Record<string, AudioBuffer> = {}
  private ready = false

  async init() {
    try {
      this.ctx = new AudioContext()
      await Promise.all(["collect","hit","gameover","powerup"].map(async (n) => {
        try {
          const ab = await (await fetch(`/sounds/${n}.mp3`)).arrayBuffer()
          this.buffers[n] = await this.ctx!.decodeAudioData(ab)
        } catch {}
      }))
      this.ready = true
    } catch {}
  }

  play(name: string, vol = 0.5) {
    if (!this.ready || !this.ctx || !this.buffers[name]) return
    if (this.ctx.state === "suspended") this.ctx.resume()
    const s = this.ctx.createBufferSource()
    s.buffer = this.buffers[name]
    const g = this.ctx.createGain(); g.gain.value = vol
    s.connect(g).connect(this.ctx.destination); s.start()
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────
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

export type CharacterType = "xbot" | "soldier" | "capsule"

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SpotlightRush({
  callbacks,
  character = "xbot",
}: {
  callbacks: GameCallbacks
  character?: CharacterType
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<{ cleanup: () => void } | null>(null)
  const cbRef = useRef(callbacks)
  cbRef.current = callbacks

  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Sound ──
    const sfx = new SoundManager()
    canvas.addEventListener("click", () => sfx.init(), { once: true })

    // ── State ──
    let score = 0, lives = 3, distance = 0
    let stageIdx = 0, act = 1
    let combo = 0, items = 0
    let dead = false
    const t0 = Date.now()
    let iframes = 0, magnet = 0

    // Lane state
    let targetLane = 1
    let charX = LANES[1]
    let charY = 0
    let jumpVel = 0
    let onGround = true
    let lastSwitch = 0

    const BASE_SPEED = 20
    const getSpeed = () => BASE_SPEED * (1 + distance * 0.00025)

    // ── Renderer ──
    const mobile = window.innerWidth <= 768
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile })
    renderer.setPixelRatio(mobile ? 1 : Math.min(devicePixelRatio, 2))
    renderer.setSize(innerWidth, innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.4

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000510, 0.007)

    // ── Camera ── behind + above, looking down the corridor
    const cam = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 180)
    cam.position.set(0, 4.5, 10)
    cam.lookAt(0, 1, -20)

    // ── Bloom ──
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, cam))
    const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.4, 0.82)
    composer.addPass(bloom)

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x334466, 2.8))
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 5.0)
    keyLight.position.set(0, 10, 8)
    scene.add(keyLight)
    const blueL = new THREE.DirectionalLight(0x0055ff, 2.5)
    blueL.position.set(-8, 4, -6)
    scene.add(blueL)
    const cyanR = new THREE.DirectionalLight(0x00ddff, 2.0)
    cyanR.position.set(8, 4, -6)
    scene.add(cyanR)
    const rimBack = new THREE.DirectionalLight(0xff6600, 1.0)
    rimBack.position.set(0, 1, 10)
    scene.add(rimBack)

    // ── Floor (recycled tiles) ──
    const TILE_LEN = 20
    const NUM_TILES = 10
    const FLOOR_W = 14
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x020210,
      emissive: 0x001133,
      emissiveIntensity: 0.25,
      roughness: 0.85,
      metalness: 0.15,
    })
    const floorTiles: THREE.Mesh[] = []
    for (let i = 0; i < NUM_TILES; i++) {
      const tile = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, TILE_LEN), floorMat.clone())
      tile.rotation.x = -Math.PI / 2
      tile.position.z = 12 - i * TILE_LEN
      scene.add(tile)
      floorTiles.push(tile)
    }

    // Grid lines (static, long — visual only)
    const gridLineMat = new THREE.LineBasicMaterial({ color: 0x003388, transparent: true, opacity: 0.35 })
    const laneDivMat = new THREE.LineBasicMaterial({ color: 0x0055ff, transparent: true, opacity: 0.45 })
    const FAR = 250
    for (let x = -7; x <= 7; x += 2) {
      const pts = [new THREE.Vector3(x, 0.02, 15), new THREE.Vector3(x, 0.02, -FAR)]
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), x % 3.5 === 0 ? laneDivMat : gridLineMat))
    }
    // Transverse grid lines (move with world using env pool)
    // done below per-tile using line segments attached to floor tiles

    // ── GLB Loader ──
    const loader = new GLTFLoader()

    const crystalModels: THREE.Group[] = []
    const crystalNames = ["Crystal_Cluster","Crystal_Small_01","Crystal_Small_02","Crystal_Small_03","Crystal_Small_04"]
    let crystalCount = 0
    crystalNames.forEach(n => loader.load(`/models/crystals/${n}.glb`, g => { crystalModels.push(g.scene); crystalCount++ }, undefined, () => crystalCount++))

    const envModels: { name: string; scene: THREE.Group }[] = []
    const envNames = ["Column_Vapor_01","Frame_Neon_Vapor_01","Frame_Neon_Vapor_02","Screen_Retro_01"]
    let envCount = 0
    envNames.forEach(n => loader.load(`/models/env/${n}.glb`, g => { envModels.push({ name: n, scene: g.scene }); envCount++ }, undefined, () => envCount++))

    // ── Character ──
    const charGroup = new THREE.Group()
    charGroup.position.set(LANES[1], 0, 0)
    scene.add(charGroup)
    let mixer: THREE.AnimationMixer | null = null

    const glowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 20),
      new THREE.MeshBasicMaterial({ color: 0x0066ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    )
    glowDisc.rotation.x = -Math.PI / 2
    glowDisc.position.y = 0.02
    charGroup.add(glowDisc)

    const glbPath = character === "soldier" ? "/models/Soldier.glb"
      : character === "capsule" ? null
      : "/models/Xbot.glb"

    if (glbPath) {
      loader.load(glbPath, (gltf) => {
        const model = gltf.scene
        model.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const arr = Array.isArray((c as THREE.Mesh).material)
              ? (c as THREE.Mesh).material as THREE.MeshStandardMaterial[]
              : [(c as THREE.Mesh).material as THREE.MeshStandardMaterial]
            arr.forEach(m => {
              if (m.isMeshStandardMaterial) {
                m.emissive = new THREE.Color(character === "soldier" ? 0x002244 : 0x0022aa)
                m.emissiveIntensity = 0.3
              }
            })
          }
        })
        charGroup.add(model)
        mixer = new THREE.AnimationMixer(model)
        if (gltf.animations.length) {
          const clip = gltf.animations.find(a => /run|walk/i.test(a.name)) ?? gltf.animations[0]
          mixer.clipAction(clip).play()
        }
      })
    } else {
      // NEON capsule character
      const mat = new THREE.MeshPhongMaterial({ color: 0x1155ff, emissive: 0x0022aa, emissiveIntensity: 0.5, shininess: 100 })
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 6, 12), mat)
      body.position.y = 0.9; charGroup.add(body)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat.clone())
      head.position.y = 1.95; charGroup.add(head)
      const visor = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5),
        new THREE.MeshPhongMaterial({ color: 0x44ccff, emissive: 0x0088ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.75 })
      )
      visor.rotation.x = Math.PI / 2; visor.position.set(0, 2.0, 0.12); charGroup.add(visor)
    }

    // ── World Object Pools ──
    interface GameObj {
      group: THREE.Group
      type: "collect" | "obstacle" | "special"
      lane: number   // 0/1/2
      points: number
      specialType?: string
      done: boolean
    }
    const gameObjs: GameObj[] = []

    interface EnvObj {
      group: THREE.Group
    }
    const envObjs: EnvObj[] = []

    // Particles
    const particles: { m: THREE.Mesh; v: THREE.Vector3; life: number }[] = []

    const burst = (pos: THREE.Vector3, color: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(
          new THREE.TetrahedronGeometry(0.04 + Math.random() * 0.05, 0),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
        )
        m.position.copy(pos); scene.add(m)
        particles.push({
          m, life: 1,
          v: new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() * 0.4), (Math.random() - 0.5) * 0.4)
        })
      }
    }

    // ── Spawn Helpers ──
    const tintClone = (template: THREE.Group, accent: number) => {
      const clone = template.clone()
      clone.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          const arr = Array.isArray((c as THREE.Mesh).material)
            ? (c as THREE.Mesh).material as THREE.MeshStandardMaterial[]
            : [(c as THREE.Mesh).material as THREE.MeshStandardMaterial]
          arr.forEach(m => {
            if (m.isMeshStandardMaterial) {
              m.emissive = new THREE.Color(accent)
              m.emissiveIntensity = 0.85
            }
          })
        }
      })
      return clone
    }

    const spawnCrystal = (z: number, lane: number) => {
      const accent = ACT_CFG[act]?.accent ?? 0x0088ff
      const g = new THREE.Group()

      if (crystalCount > 0 && crystalModels.length > 0) {
        const clone = tintClone(crystalModels[Math.floor(Math.random() * crystalModels.length)], accent)
        clone.scale.setScalar(0.4 + Math.random() * 0.25)
        g.add(clone)
      } else {
        g.add(new THREE.Mesh(
          new THREE.OctahedronGeometry(0.28, 0),
          new THREE.MeshPhongMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.8, flatShading: true })
        ))
      }
      // Halo
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.38, 0.48, 10),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      )
      halo.rotation.x = -Math.PI / 2
      g.add(halo)

      g.position.set(LANES[lane], 1.1, z)
      scene.add(g)
      gameObjs.push({ group: g, type: "collect", lane, points: STAGES[stageIdx].points, done: false })
    }

    const spawnCrystalRow = (z: number) => {
      // 1–3 crystals, at least one free lane
      const available = [0, 1, 2]
      const count = Math.random() < 0.25 ? 3 : Math.random() < 0.55 ? 2 : 1
      for (let i = 0; i < count; i++) {
        if (available.length === 0) break
        const idx = Math.floor(Math.random() * available.length)
        spawnCrystal(z + (Math.random() - 0.5) * 3, available.splice(idx, 1)[0])
      }
    }

    const spawnObstacle = (z: number) => {
      // Block 1 or 2 lanes (always leave at least 1 free)
      const blocked = new Set<number>()
      const maxBlock = Math.random() < 0.5 ? 1 : 2
      while (blocked.size < maxBlock) blocked.add(Math.floor(Math.random() * 3))

      blocked.forEach(lane => {
        const g = new THREE.Group()
        // Main bar
        const barMat = new THREE.MeshPhongMaterial({ color: 0x110022, emissive: 0xff0044, emissiveIntensity: 0.5 })
        g.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 0.35), barMat))
        // Warning nodes
        const nodeMat = new THREE.MeshPhongMaterial({ color: 0xff2244, emissive: 0xff0022, emissiveIntensity: 0.7, flatShading: true })
        const nL = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), nodeMat)
        nL.position.x = -1.15; g.add(nL)
        const nR = nL.clone(); nR.position.x = 1.15; g.add(nR)
        // Glow plane
        g.add(new THREE.Mesh(
          new THREE.PlaneGeometry(3.2, 1.6),
          new THREE.MeshBasicMaterial({ color: 0xff0022, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
        ))

        g.position.set(LANES[lane], 0.65, z)
        scene.add(g)
        gameObjs.push({ group: g, type: "obstacle", lane, points: 0, done: false })
      })
    }

    const spawnSpecial = (z: number) => {
      const r = Math.random()
      if (r < 0.06) {
        // 1UP
        const g = new THREE.Group()
        g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 1),
          new THREE.MeshPhongMaterial({ color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 0.85, flatShading: true })))
        g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })))
        g.position.set(LANES[Math.floor(Math.random() * 3)], 1.5, z)
        scene.add(g)
        gameObjs.push({ group: g, type: "special", lane: Math.floor(g.position.x < -1 ? 0 : g.position.x < 1 ? 1 : 2), points: 0, specialType: "1up", done: false })
      } else if (r < 0.12) {
        // Magnet
        const g = new THREE.Group()
        g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0),
          new THREE.MeshPhongMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.7, flatShading: true })))
        const torus = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 6, 12),
          new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.4 }))
        torus.rotation.x = Math.PI / 2; g.add(torus)
        g.position.set(LANES[Math.floor(Math.random() * 3)], 1.5, z)
        scene.add(g)
        gameObjs.push({ group: g, type: "special", lane: Math.floor(g.position.x < -1 ? 0 : g.position.x < 1 ? 1 : 2), points: 0, specialType: "magnet", done: false })
      }
    }

    // ── Env Spawner ──
    const spawnEnvSide = (z: number) => {
      const accent = ACT_CFG[act]?.accent ?? 0x0088ff

      if (envCount > 0 && envModels.length > 0) {
        const em = envModels[Math.floor(Math.random() * envModels.length)]
        for (const sx of [-7.5, 7.5]) {
          const clone = tintClone(em.scene, accent)
          clone.scale.setScalar(0.7 + Math.random() * 0.5)
          const g = new THREE.Group()
          g.add(clone)
          g.position.set(sx, 0, z)
          g.rotation.y = sx > 0 ? -Math.PI / 5 : Math.PI / 5
          scene.add(g)
          envObjs.push({ group: g })
        }
      } else {
        // Fallback neon columns
        const colMat = new THREE.MeshPhongMaterial({ color: 0x002244, emissive: 0x0044ff, emissiveIntensity: 0.4 })
        for (const sx of [-7, 7]) {
          const g = new THREE.Group()
          g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 5, 8), colMat.clone()))
          g.position.set(sx, 2.5, z)
          scene.add(g)
          envObjs.push({ group: g })
        }
      }
    }

    // ── Spawn tracking ──
    // Objects spawn at Z = -60 (ahead), move toward +Z
    // Spawn interval: every ~SPAWN_GAP world units
    let spawnZ = -60         // current Z to spawn next batch at
    const COLLECT_GAP = 14  // units between crystal rows
    const OBST_GAP = 22     // units between obstacle rows
    const ENV_GAP = 18      // units between env pairs
    let nextCollect = spawnZ
    let nextObst = spawnZ + 10
    let nextEnv = spawnZ

    // Initial fill
    for (let z = -60; z < 0; z += COLLECT_GAP) spawnCrystalRow(z)
    for (let z = -55; z < 0; z += OBST_GAP) spawnObstacle(z)
    for (let z = -60; z < 0; z += ENV_GAP) spawnEnvSide(z)
    spawnZ = -60

    // ── Input ──
    const switchLane = (dir: number) => {
      const now = performance.now()
      if (now - lastSwitch < 160) return
      lastSwitch = now
      targetLane = Math.max(0, Math.min(2, targetLane + dir))
    }

    const jump = () => { if (onGround) { jumpVel = 9.5; onGround = false; sfx.play("collect", 0.3) } }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") switchLane(-1)
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") switchLane(1)
      if (e.key === "ArrowUp"   || e.key === " " || e.key === "w" || e.key === "W") jump()
    }

    let tStartX = 0, tStartY = 0
    const onTouchStart = (e: TouchEvent) => { tStartX = e.touches[0].clientX; tStartY = e.touches[0].clientY }
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - tStartX
      const dy = e.changedTouches[0].clientY - tStartY
      if (Math.abs(dx) > Math.abs(dy)) { if (dx < -30) switchLane(-1); else if (dx > 30) switchLane(1) }
      else if (dy < -30) jump()
    }

    // Tilt for mobile lane switching
    let gyroLastLane = 1
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return
      const g = e.gamma
      if (g < -18 && gyroLastLane > targetLane) { switchLane(-1); gyroLastLane = targetLane }
      else if (g > 18 && gyroLastLane < targetLane) { switchLane(1); gyroLastLane = targetLane }
      else if (g < -18) { switchLane(-1); gyroLastLane = targetLane }
      else if (g > 18) { switchLane(1); gyroLastLane = targetLane }
    }
    const reqGyro = async () => {
      const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof D.requestPermission === "function") {
        try { if (await D.requestPermission() === "granted") window.addEventListener("deviceorientation", onOrient) } catch {}
      } else { window.addEventListener("deviceorientation", onOrient) }
    }
    reqGyro()
    window.addEventListener("keydown", onKeyDown)
    canvas.addEventListener("touchstart", onTouchStart, { passive: true })
    canvas.addEventListener("touchend", onTouchEnd, { passive: true })

    // ── Animation Loop ──
    let raf: number, prev = performance.now()

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (dead) return
      const dt = Math.min((now - prev) / 1000, 0.05); prev = now
      const t = now * 0.001
      const spd = getSpeed()

      if (mixer) mixer.update(dt)

      // Distance (progress)
      distance += spd * dt
      cbRef.current.onHeightChange(Math.floor(distance))

      if (iframes > 0) iframes -= dt
      if (magnet > 0) magnet -= dt

      // Stage progression
      for (let i = stageIdx + 1; i < STAGES.length; i++) {
        if (distance >= STAGES[i].dist) {
          stageIdx = i; act = STAGES[i].act
          cbRef.current.onStageChange(i, STAGES[i])
        }
      }

      // Lane / character movement
      charX += (LANES[targetLane] - charX) * 12 * dt

      // Jump physics
      if (!onGround) {
        jumpVel -= 22 * dt
        charY += jumpVel * dt
        if (charY <= 0) { charY = 0; jumpVel = 0; onGround = true }
      }

      charGroup.position.set(charX, charY, 0)
      // Lean into lane change
      charGroup.rotation.z = -(LANES[targetLane] - charX) * 0.08
      ;(glowDisc.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(now * 0.004) * 0.08

      // Camera smoothly follows charX
      const camTargetX = charX * 0.35
      cam.position.x += (camTargetX - cam.position.x) * 5 * dt
      cam.lookAt(charX * 0.25, 1.2, -25)

      // Light follows character
      keyLight.position.set(charX, 10, 8)
      blueL.position.set(charX - 8, 4, -6)
      cyanR.position.set(charX + 8, 4, -6)

      // Move floor tiles
      for (const tile of floorTiles) {
        tile.position.z += spd * dt
        if (tile.position.z > 15) tile.position.z -= NUM_TILES * TILE_LEN
        // Update floor emissive color per act
        ;(tile.material as THREE.MeshStandardMaterial).emissive.set(ACT_CFG[act]?.floorEmit ?? 0x001133)
      }

      // Move env objects
      for (let i = envObjs.length - 1; i >= 0; i--) {
        envObjs[i].group.position.z += spd * dt
        if (envObjs[i].group.position.z > 16) {
          scene.remove(envObjs[i].group)
          envObjs.splice(i, 1)
        }
      }

      // Move game objects
      for (let i = gameObjs.length - 1; i >= 0; i--) {
        const obj = gameObjs[i]
        if (obj.done) continue
        obj.group.position.z += spd * dt

        // Animate
        obj.group.rotation.y += dt * 2
        if (obj.type === "collect" || obj.type === "special") {
          obj.group.position.y += Math.sin(t * 2.5 + i * 0.8) * dt * 0.08
        }

        // Magnet pull toward current lane
        if (magnet > 0 && obj.type === "collect") {
          const tx = LANES[targetLane]
          obj.group.position.x += (tx - obj.group.position.x) * 4 * dt
        }

        // Collision: check if within hit Z range and correct lane (or close enough)
        const dz = Math.abs(obj.group.position.z - 0)  // character at Z=0
        const dx = Math.abs(obj.group.position.x - charX)
        const dy = Math.abs(obj.group.position.y - (charY + 0.9))

        const hitRadius = obj.type === "obstacle" ? 1.1 : 1.4

        if (dz < hitRadius && dx < hitRadius && dy < hitRadius + 0.3) {
          obj.done = true
          scene.remove(obj.group)

          if (obj.type === "collect") {
            combo++; items++
            let mult = 1
            for (const cm of COMBO_NAMES) if (combo >= cm.count) mult = cm.mult
            score += Math.round(obj.points * mult)
            cbRef.current.onScoreChange(score)
            for (const cm of COMBO_NAMES) if (combo === cm.count) cbRef.current.onCombo(combo, cm.name, cm.mult)
            burst(obj.group.position.clone(), ACT_CFG[act]?.accent ?? 0x0088ff, 8)
            sfx.play("collect", 0.4)

          } else if (obj.type === "special") {
            if (obj.specialType === "1up") {
              lives = Math.min(lives + 1, 5); cbRef.current.onLivesChange(lives)
              cbRef.current.onSpecialItem("OFF THE PLASTIC")
              burst(obj.group.position.clone(), 0x00ffaa, 22); sfx.play("powerup", 0.6)
            } else if (obj.specialType === "magnet") {
              magnet = 8; cbRef.current.onSpecialItem("물 들어온다!")
              burst(obj.group.position.clone(), 0xffaa00, 16); sfx.play("powerup", 0.5)
            }

          } else if (obj.type === "obstacle" && iframes <= 0) {
            lives--; combo = 0
            cbRef.current.onComboReset(); cbRef.current.onLivesChange(lives)
            iframes = 1.5
            burst(obj.group.position.clone(), 0xff2244, 14); sfx.play("hit", 0.6)
            if (lives <= 0) {
              dead = true; sfx.play("gameover", 0.7)
              cbRef.current.onGameOver(score, stageIdx + 1, items, Date.now() - t0)
              return
            }
          }
        }

        // Remove objects that passed behind camera
        if (obj.group.position.z > 14) {
          if (!obj.done && obj.type !== "obstacle") { combo = 0; cbRef.current.onComboReset() }
          obj.done = true; scene.remove(obj.group)
        }
      }

      // Spawn ahead (objects spawn at Z = -60, moving toward player)
      // We spawn when the previously-spawned Z has moved enough
      const spawnThreshold = -55
      if (nextCollect > spawnThreshold) { spawnCrystalRow(nextCollect); nextCollect -= COLLECT_GAP }
      if (nextObst > spawnThreshold) { spawnObstacle(nextObst); spawnSpecial(nextObst - 8); nextObst -= OBST_GAP }
      if (nextEnv > spawnThreshold) { spawnEnvSide(nextEnv); nextEnv -= ENV_GAP }

      // Advance spawn pointers with world
      nextCollect += spd * dt
      nextObst += spd * dt
      nextEnv += spd * dt

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.m.position.add(p.v); p.life -= dt * 2.5
        ;(p.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life)
        if (p.life <= 0) { scene.remove(p.m); particles.splice(i, 1) }
      }

      // Character blink during iframes
      charGroup.visible = iframes > 0 ? Math.floor(now / 80) % 2 === 0 : true

      // Fog color per act
      ;(scene.fog as THREE.FogExp2).color.set(ACT_CFG[act]?.fog ?? 0x000510)

      composer.render()
    }

    raf = requestAnimationFrame(loop)

    const onResize = () => {
      cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix()
      renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight)
    }
    window.addEventListener("resize", onResize)

    const cleanup = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("deviceorientation", onOrient)
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchend", onTouchEnd)
      renderer.dispose()
    }
    gameRef.current = { cleanup }
    return cleanup
  }, [character])

  useEffect(() => {
    const c = initGame()
    return () => { c?.(); gameRef.current?.cleanup() }
  }, [initGame])

  return <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }} />
}
