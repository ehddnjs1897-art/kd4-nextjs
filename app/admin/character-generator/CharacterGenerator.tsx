'use client'

/**
 * 캐릭터셋 생성기 — 클라이언트 전용
 *
 * 렌더 전략: 단일 <canvas>가 라이브 미리보기 겸 PNG 추출 소스(single source of truth).
 *  - 입력이 바뀔 때마다 base 해상도(1536x1024)로 다시 그림
 *  - 추출 시 동일 draw 로직을 scale 3배 오프스크린 캔버스로 재실행 → 고해상도 PNG
 *
 * 원본 사진은 drawImage로 그대로 사용한다 (얼굴 생성/변형 없음).
 * 색보정은 ctx.filter(밝기/대비/채도) + soft-light 온도 오버레이로만 수행 → 픽셀 왜곡 없음.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── 상수 (base 캔버스 좌표계) ────────────────────────────────────────────────
const BASE_W = 1536
const BASE_H = 1024
const BG_COLOR = '#F6F2EE'
const AWARD_COLOR = '#C62828'
const INK = '#1f1d1a'
const SUB = '#6b6359'
const LINE = '#d8d0c5'

const FONT_SANS = "'KoPubWorld Dotum', 'Noto Sans KR', sans-serif"

const PHOTO_TOP = 96
const PHOTO_H = 812
const PHOTO_LEFT = 48
const PHOTO_GAP = 18
const PHOTO_AREA_RIGHT = 1008
const PHOTO_W = (PHOTO_AREA_RIGHT - PHOTO_LEFT - PHOTO_GAP * 2) / 3

const INFO_X = 1064
const INFO_W = BASE_W - INFO_X - 48

const SLOT_LABELS = ['정면', '우측면', '좌측면'] as const
type SlotKey = 0 | 1 | 2

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface PhotoAdjust {
  brightness: number // 0.5 ~ 1.5
  contrast: number // 0.5 ~ 1.5
  saturate: number // 0 ~ 2
  warmth: number // -50 ~ 50  (음수 = 노란기 제거/쿨)
  zoom: number // 1 ~ 2.5
  offsetX: number // -1 ~ 1 (박스 폭 기준 비율)
  offsetY: number // -1 ~ 1
}

const DEFAULT_ADJUST: PhotoAdjust = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
  warmth: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
}

interface Filmography {
  network: string // 방송사/플랫폼 + 제목 (예: "tvN 나의 유죄인간")
  role: string // 배역 설명 (예: "박변호사 (이사모 팬클럽 회장)")
}

// ─── 기본값: 사용자가 채팅에서 직접 알려준 권동원 데이터로 프리필 ──────────────
const DEFAULTS = {
  name: '권동원',
  birthAge: '1990년생 (37세)',
  height: '키 : 175cm',
  weight: '몸무게 : 73kg',
  contact: '연락처 : 010-8564-0244',
  sectionTitle: '전문직 (오피스) 출연작',
  award: '*K-웹드라마 어워드 연기상 수상',
  films: [
    { network: 'tvN 나의 유죄인간', role: '박변호사 (이사모 팬클럽 회장)' },
    { network: 'tvN 소용없어 거짓말', role: '수협직원 (사건을 고발하는 증인)' },
    { network: 'MBC 넘버스', role: '회계 고문 변호사 (권위적이고 깐깐한 변호사)' },
    { network: '숏폼 아멜리아의 직장생활', role: '권대리 (사내 분위기 메이커, 조연)' },
  ] as Filmography[],
}

// ─── 텍스트 줄바꿈 헬퍼 ───────────────────────────────────────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const ch of text) {
    const test = current + ch
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = ch
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// ─── 카드 렌더 함수 (base 좌표 → s배 스케일로 그림) ───────────────────────────
interface DrawData {
  name: string
  birthAge: string
  height: string
  weight: string
  contact: string
  sectionTitle: string
  films: Filmography[]
  award: string
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  s: number,
  data: DrawData,
  images: (HTMLImageElement | null)[],
  adjusts: PhotoAdjust[]
) {
  // 배경
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, BASE_W * s, BASE_H * s)

  // ── 사진 3장 ──
  for (let i = 0; i < 3; i++) {
    const x = PHOTO_LEFT + i * (PHOTO_W + PHOTO_GAP)
    const boxX = x * s
    const boxY = PHOTO_TOP * s
    const boxW = PHOTO_W * s
    const boxH = PHOTO_H * s
    const img = images[i]
    const adj = adjusts[i]

    ctx.save()
    // 둥근 모서리 클립
    const r = 6 * s
    ctx.beginPath()
    ctx.moveTo(boxX + r, boxY)
    ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + boxH, r)
    ctx.arcTo(boxX + boxW, boxY + boxH, boxX, boxY + boxH, r)
    ctx.arcTo(boxX, boxY + boxH, boxX, boxY, r)
    ctx.arcTo(boxX, boxY, boxX + boxW, boxY, r)
    ctx.closePath()
    ctx.clip()

    if (img && img.complete && img.naturalWidth > 0) {
      // object-fit: cover + zoom + offset
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const baseScale = Math.max(boxW / iw, boxH / ih)
      const scale = baseScale * adj.zoom
      const drawW = iw * scale
      const drawH = ih * scale
      const dx = boxX + (boxW - drawW) / 2 + (adj.offsetX * boxW) / 2
      const dy = boxY + (boxH - drawH) / 2 + (adj.offsetY * boxH) / 2

      ctx.filter = `brightness(${adj.brightness}) contrast(${adj.contrast}) saturate(${adj.saturate})`
      ctx.drawImage(img, dx, dy, drawW, drawH)
      ctx.filter = 'none'

      // 온도 오버레이 (노란기 제거 = 쿨톤)
      if (adj.warmth !== 0) {
        const a = Math.min(Math.abs(adj.warmth) / 200, 0.4)
        ctx.globalCompositeOperation = 'soft-light'
        ctx.fillStyle =
          adj.warmth > 0
            ? `rgba(255, 196, 120, ${a})`
            : `rgba(120, 176, 255, ${a})`
        ctx.fillRect(boxX, boxY, boxW, boxH)
        ctx.globalCompositeOperation = 'source-over'
      }
    } else {
      // placeholder
      ctx.fillStyle = '#e7e0d6'
      ctx.fillRect(boxX, boxY, boxW, boxH)
      ctx.fillStyle = '#a99f90'
      ctx.font = `${24 * s}px ${FONT_SANS}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${SLOT_LABELS[i]} 사진`, boxX + boxW / 2, boxY + boxH / 2)
    }
    ctx.restore()

    // 라벨
    ctx.fillStyle = INK
    ctx.font = `500 ${28 * s}px ${FONT_SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(SLOT_LABELS[i], boxX + boxW / 2, (PHOTO_TOP + PHOTO_H + 44) * s)
  }

  // ── 우측 정보 패널 ──
  const ix = INFO_X * s
  const iw = INFO_W * s
  ctx.textAlign = 'left'

  // 이름
  ctx.fillStyle = INK
  ctx.font = `700 ${62 * s}px ${FONT_SANS}`
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(data.name || '이름', ix, 178 * s)

  // 구분선
  ctx.strokeStyle = LINE
  ctx.lineWidth = 1.5 * s
  ctx.beginPath()
  ctx.moveTo(ix, 214 * s)
  ctx.lineTo(ix + iw, 214 * s)
  ctx.stroke()

  // 프로필 정보
  let cy = 268
  ctx.fillStyle = '#34302a'
  ctx.font = `400 ${26 * s}px ${FONT_SANS}`
  for (const line of [data.birthAge, data.height, data.weight, data.contact]) {
    if (line) {
      ctx.fillText(line, ix, cy * s)
      cy += 42
    }
  }

  // 섹션 제목
  cy += 26
  ctx.fillStyle = INK
  ctx.font = `700 ${30 * s}px ${FONT_SANS}`
  ctx.fillText(data.sectionTitle || '출연작', ix, cy * s)
  cy += 46

  // 출연작 목록
  for (const f of data.films) {
    if (!f.network && !f.role) continue
    ctx.fillStyle = INK
    ctx.font = `700 ${26 * s}px ${FONT_SANS}`
    if (f.network) {
      const nlines = wrapText(ctx, f.network, iw)
      for (const nl of nlines) {
        ctx.fillText(nl, ix, cy * s)
        cy += 36
      }
    }
    if (f.role) {
      ctx.fillStyle = SUB
      ctx.font = `400 ${23 * s}px ${FONT_SANS}`
      const rlines = wrapText(ctx, `· ${f.role}`, iw - 14)
      for (let k = 0; k < rlines.length; k++) {
        ctx.fillText(rlines[k], (INFO_X + (k === 0 ? 0 : 16)) * s, cy * s)
        cy += 32
      }
    }
    cy += 18
  }

  // 수상 경력 (하단 고정)
  if (data.award) {
    ctx.fillStyle = AWARD_COLOR
    ctx.font = `700 ${27 * s}px ${FONT_SANS}`
    const alines = wrapText(ctx, data.award, iw)
    let ay = 968 - (alines.length - 1) * 36
    for (const al of alines) {
      ctx.fillText(al, ix, ay * s)
      ay += 36
    }
  }
}

// ─── 슬라이더 입력 컴포넌트 ───────────────────────────────────────────────────
function Slider({
  label, value, min, max, step, onChange, fmt,
}: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; fmt?: (v: number) => string
}) {
  return (
    <label style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
        <span>{label}</span>
        <span style={{ color: '#888' }}>{fmt ? fmt(value) : value}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function CharacterGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([null, null, null])
  const [fontsReady, setFontsReady] = useState(false)
  const [, forceTick] = useState(0)
  const redraw = useCallback(() => forceTick((t) => t + 1), [])

  // 폼 상태
  const [name, setName] = useState(DEFAULTS.name)
  const [birthAge, setBirthAge] = useState(DEFAULTS.birthAge)
  const [height, setHeight] = useState(DEFAULTS.height)
  const [weight, setWeight] = useState(DEFAULTS.weight)
  const [contact, setContact] = useState(DEFAULTS.contact)
  const [sectionTitle, setSectionTitle] = useState(DEFAULTS.sectionTitle)
  const [award, setAward] = useState(DEFAULTS.award)
  const [films, setFilms] = useState<Filmography[]>(DEFAULTS.films)
  const [adjusts, setAdjusts] = useState<PhotoAdjust[]>([
    { ...DEFAULT_ADJUST }, { ...DEFAULT_ADJUST }, { ...DEFAULT_ADJUST },
  ])
  const [activeSlot, setActiveSlot] = useState<SlotKey>(0)

  // 폰트 로드 대기 (canvas는 로드된 폰트만 사용 가능)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        await Promise.all([
          (document as Document).fonts.load(`700 62px 'KoPubWorld Dotum'`),
          (document as Document).fonts.load(`400 26px 'KoPubWorld Dotum'`),
          (document as Document).fonts.ready,
        ])
      } catch {
        /* 폰트 로드 실패해도 fallback으로 진행 */
      }
      if (alive) setFontsReady(true)
    }
    load()
    return () => { alive = false }
  }, [])

  // 데이터 변경 시 미리보기 캔버스 다시 그림
  const data: DrawData = { name, birthAge, height, weight, contact, sectionTitle, films, award }
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCard(ctx, 1, data, imagesRef.current, adjusts)
  })

  // 사진 업로드
  const onUpload = (slot: SlotKey, file: File | null) => {
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      alert('이미지는 15MB 이하만 업로드 가능합니다.')
      return
    }
    const img = new Image()
    img.onload = () => {
      imagesRef.current[slot] = img
      redraw()
    }
    img.src = URL.createObjectURL(file)
  }

  // 보정값 변경
  const updateAdjust = (slot: SlotKey, patch: Partial<PhotoAdjust>) => {
    setAdjusts((prev) => prev.map((a, i) => (i === slot ? { ...a, ...patch } : a)))
  }

  // "정면 기준 통일" — 정면(0번) 색보정값을 좌/우측면에 복사 (줌/위치는 제외)
  const unifyToFront = () => {
    const f = adjusts[0]
    setAdjusts((prev) =>
      prev.map((a, i) =>
        i === 0 ? a : { ...a, brightness: f.brightness, contrast: f.contrast, saturate: f.saturate, warmth: f.warmth }
      )
    )
  }

  // 출연작 행 편집
  const updateFilm = (idx: number, patch: Partial<Filmography>) =>
    setFilms((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  const addFilm = () => setFilms((prev) => [...prev, { network: '', role: '' }])
  const removeFilm = (idx: number) => setFilms((prev) => prev.filter((_, i) => i !== idx))

  // PNG 추출 (3배 고해상도)
  const exportPNG = async () => {
    const scale = 3
    const off = document.createElement('canvas')
    off.width = BASE_W * scale
    off.height = BASE_H * scale
    const ctx = off.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingQuality = 'high'
    drawCard(ctx, scale, data, imagesRef.current, adjusts)
    off.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name || '배우'}_캐릭터셋.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const adj = adjusts[activeSlot]

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 80px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>캐릭터셋 프로필 생성기</h1>
      <p style={{ color: '#777', fontSize: 14, marginBottom: 24 }}>
        정면·우측면·좌측면 사진 3장을 올리고 정보를 입력하면 캐스팅 프로필 카드가 자동으로 만들어집니다.
        원본 사진은 그대로 사용되며 얼굴은 변형되지 않습니다.
      </p>

      {/* 미리보기 */}
      <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <canvas
          ref={canvasRef}
          width={BASE_W}
          height={BASE_H}
          style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: BG_COLOR }}
        />
        {!fontsReady && <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>폰트 로드 중…</p>}
      </div>

      <button
        onClick={exportPNG}
        style={{
          background: '#15488A', color: '#fff', border: 'none', borderRadius: 8,
          padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 32,
        }}
      >
        PNG 고해상도 내보내기 (4608×3072)
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* ── 왼쪽: 사진 + 색보정 ── */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>① 사진 & 색보정</h2>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {SLOT_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveSlot(i as SlotKey)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: activeSlot === i ? '2px solid #15488A' : '1px solid #ccc',
                  background: activeSlot === i ? '#eef3fb' : '#fff',
                  fontWeight: activeSlot === i ? 700 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="file" accept="image/*"
            onChange={(e) => onUpload(activeSlot, e.target.files?.[0] ?? null)}
            style={{ marginBottom: 16, fontSize: 13 }}
          />

          <div style={{ background: '#faf8f4', border: '1px solid #eee', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
              {SLOT_LABELS[activeSlot]} 보정
            </p>
            <Slider label="밝기" value={adj.brightness} min={0.5} max={1.5} step={0.01}
              onChange={(v) => updateAdjust(activeSlot, { brightness: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
            <Slider label="대비" value={adj.contrast} min={0.5} max={1.5} step={0.01}
              onChange={(v) => updateAdjust(activeSlot, { contrast: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
            <Slider label="채도" value={adj.saturate} min={0} max={2} step={0.01}
              onChange={(v) => updateAdjust(activeSlot, { saturate: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
            <Slider label="온도 (− 노란기 제거 / + 따뜻하게)" value={adj.warmth} min={-50} max={50} step={1}
              onChange={(v) => updateAdjust(activeSlot, { warmth: v })} />
            <Slider label="확대" value={adj.zoom} min={1} max={2.5} step={0.01}
              onChange={(v) => updateAdjust(activeSlot, { zoom: v })} fmt={(v) => `${v.toFixed(2)}x`} />
            <Slider label="좌우 위치" value={adj.offsetX} min={-1} max={1} step={0.01}
              onChange={(v) => updateAdjust(activeSlot, { offsetX: v })} fmt={(v) => v.toFixed(2)} />
            <Slider label="상하 위치" value={adj.offsetY} min={-1} max={1} step={0.01}
              onChange={(v) => updateAdjust(activeSlot, { offsetY: v })} fmt={(v) => v.toFixed(2)} />
          </div>

          <button
            onClick={unifyToFront}
            style={{
              marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
              border: '1px solid #15488A', color: '#15488A', background: '#fff', fontSize: 14, fontWeight: 700,
            }}
          >
            정면 색감을 좌·우측면에 통일 적용
          </button>
          <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
            3장의 피부톤·화이트밸런스를 정면 기준으로 맞춥니다 (밝기·대비·채도·온도만 복사, 줌/위치는 각자 유지).
          </p>
        </section>

        {/* ── 오른쪽: 정보 입력 ── */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>② 프로필 정보</h2>

          <Field label="이름" value={name} onChange={setName} />
          <Field label="출생/나이" value={birthAge} onChange={setBirthAge} />
          <Field label="키" value={height} onChange={setHeight} />
          <Field label="몸무게" value={weight} onChange={setWeight} />
          <Field label="연락처" value={contact} onChange={setContact} />
          <Field label="섹션 제목" value={sectionTitle} onChange={setSectionTitle} />

          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '20px 0 10px' }}>출연작</h3>
          {films.map((f, i) => (
            <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 10, background: '#faf8f4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#888' }}>#{i + 1}</span>
                <button onClick={() => removeFilm(i)} style={{ fontSize: 12, color: '#c62828', background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
              </div>
              <input
                value={f.network} placeholder="방송사 + 제목 (예: tvN 나의 유죄인간)"
                onChange={(e) => updateFilm(i, { network: e.target.value })}
                style={inputStyle}
              />
              <input
                value={f.role} placeholder="배역 (예: 박변호사 (이사모 팬클럽 회장))"
                onChange={(e) => updateFilm(i, { role: e.target.value })}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>
          ))}
          <button onClick={addFilm} style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, border: '1px dashed #999', background: '#fff', cursor: 'pointer', marginBottom: 20 }}>
            + 출연작 추가
          </button>

          <Field label="수상 경력 (붉은색 강조)" value={award} onChange={setAward} />
        </section>
      </div>
    </div>
  )
}

// ─── 입력 필드 ────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box',
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </label>
  )
}
