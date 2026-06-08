'use client'

import { useMemo, useState } from 'react'

export type MonthRevenue = {
  key: string
  label: string
  won: number
  man: number
}

export type ScheduleMap = Record<string, Record<string, string[]>>

export type UnpaidRow = {
  name: string
  className: string
  amount: number
  status: string
}

const ICON: Record<string, string> = {
  '출연영상 18기': '🎬',
  '출연영상 19기': '🎬',
  '출연영상 20기': '🎬',
  '출연영상 1달완성': '🎬',
  마이즈너: '🎭',
  '마이즈너 2기': '🎭',
  오디션: '🎯',
  '액터스 리더 시즌2': '⭐',
  레피티션: '🔁',
  움직임: '🤸',
  개인레슨: '🙋',
  심화: '📈',
}

const GOAL_MAN = 1100 // 월 목표 매출 1,100만

function formatMan(man: number): string {
  return man.toLocaleString('ko-KR')
}

export default function SalesDashboard({
  monthKeys,
  revenue,
  schedule,
  unpaid,
}: {
  monthKeys: string[]
  revenue: MonthRevenue[]
  schedule: ScheduleMap
  unpaid: UnpaidRow[]
}) {
  const revByKey = useMemo(() => {
    const m: Record<string, MonthRevenue> = {}
    revenue.forEach((r) => (m[r.key] = r))
    return m
  }, [revenue])

  const labelByKey = useMemo(() => {
    const m: Record<string, string> = {}
    revenue.forEach((r) => (m[r.key] = r.label))
    return m
  }, [revenue])

  // 기본 선택: 가장 최신 월
  const [selected, setSelected] = useState<string>(
    monthKeys.length ? monthKeys[monthKeys.length - 1] : ''
  )

  const curRev = revByKey[selected]?.man ?? 0
  const curLabel = labelByKey[selected] ?? selected
  const sch = schedule[selected] ?? {}

  const headcount = Object.values(sch).reduce((a, b) => a + b.length, 0)
  const classCount = Object.keys(sch).length

  // 전월 대비
  const idx = monthKeys.indexOf(selected)
  const prevMan = idx > 0 ? revByKey[monthKeys[idx - 1]]?.man ?? null : null
  const deltaTxt =
    prevMan != null
      ? `${curRev >= prevMan ? '▲' : '▼'} 전월 ${formatMan(prevMan)}만 대비`
      : '—'
  const deltaCls = prevMan != null ? (curRev >= prevMan ? 'up' : 'down') : ''

  const goalPct = Math.round((curRev / GOAL_MAN) * 1000) / 10

  // 막대그래프 최대값
  const maxMan = Math.max(1, ...revenue.map((r) => r.man))

  // 수강현황 — 인원 많은 순 정렬
  const schOrder = Object.entries(sch).sort((a, b) => b[1].length - a[1].length)

  const unpaidTotal = unpaid.reduce((a, b) => a + b.amount, 0)

  return (
    <div className="sales-dash">
      <style jsx>{`
        .sales-dash {
          --bg: #f0f0e8;
          --bg2: #e8e8df;
          --card: #ffffff;
          --line: #d2d2c8;
          --line2: #b8b8ac;
          --navy: #15488a;
          --navy-light: #1e5ba8;
          --navy-deep: #0f3364;
          --navy-t1: rgba(21, 72, 138, 0.06);
          --red: #c73e3e;
          --txt: #111111;
          --sub: #6b6660;
          --green: #2e7d52;
          --amber: #b8860b;
          font-family: var(--font-sans), 'KoPubWorld Dotum', 'Apple SD Gothic Neo',
            'Malgun Gothic', sans-serif;
          background: var(--bg);
          color: var(--txt);
          padding: 28px 32px;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        .head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .head h1 {
          font-family: var(--font-serif), 'KoPubWorld Batang', serif;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--navy-deep);
        }
        .head .sub {
          color: var(--sub);
          font-size: 13px;
          margin-top: 5px;
        }
        .ptag {
          display: inline-block;
          background: var(--navy);
          color: #fff;
          font-size: 11px;
          padding: 3px 9px;
          border-radius: 6px;
          margin-left: 8px;
          vertical-align: middle;
          font-weight: 700;
        }
        select {
          background: var(--card);
          border: 1px solid var(--line2);
          border-radius: 10px;
          padding: 9px 15px;
          font-size: 14px;
          color: var(--navy);
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .sect {
          font-family: var(--font-serif), 'KoPubWorld Batang', serif;
          font-size: 15px;
          font-weight: 800;
          color: var(--navy-deep);
          margin: 26px 2px 14px;
        }
        .kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .kpi {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .kpi .label {
          color: var(--sub);
          font-size: 13px;
          margin-bottom: 10px;
        }
        .kpi .val {
          font-size: 29px;
          font-weight: 800;
          letter-spacing: -1px;
          color: var(--navy);
        }
        .kpi .unit {
          font-size: 15px;
          color: var(--sub);
          font-weight: 600;
          margin-left: 3px;
        }
        .kpi .delta {
          font-size: 12px;
          margin-top: 8px;
        }
        .up {
          color: var(--green);
        }
        .down {
          color: var(--red);
        }
        .warn {
          color: var(--amber);
        }
        .panel {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .bars {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 170px;
          padding: 0 4px;
          border-bottom: 2px solid var(--line);
        }
        .bw {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
        }
        .bar {
          width: 72%;
          background: linear-gradient(180deg, var(--navy-light), var(--navy));
          border-radius: 5px 5px 0 0;
          position: relative;
          min-height: 2px;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: filter 0.15s;
        }
        .bar:hover {
          filter: brightness(1.08);
        }
        .bar.sel {
          background: linear-gradient(180deg, #d98c2a, var(--amber));
        }
        .bar .v {
          position: absolute;
          top: -19px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          color: var(--sub);
        }
        .bx {
          margin-top: 7px;
          font-size: 10px;
          color: var(--sub);
        }
        .cls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .clsrow {
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 13px 16px;
          background: var(--navy-t1);
        }
        .clshd {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 7px;
        }
        .clsname {
          font-weight: 700;
          color: var(--navy-deep);
          font-size: 14px;
        }
        .clscnt {
          background: var(--navy);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          padding: 3px 12px;
          border-radius: 20px;
        }
        .clsmem {
          font-size: 12.5px;
          color: var(--txt);
          line-height: 1.7;
        }
        .money {
          font-weight: 700;
          color: var(--navy);
        }
        .unpaid-box {
          background: #fff;
          border: 1.5px solid var(--red);
          border-radius: 16px;
          padding: 18px;
          margin-top: 8px;
        }
        .unpaid-box h3 {
          color: var(--red);
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .urow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 9px 0;
          font-size: 14px;
          border-bottom: 1px solid var(--bg2);
        }
        .urow:last-child {
          border-bottom: none;
        }
        .btn {
          background: var(--navy);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 15px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .foot {
          color: var(--sub);
          font-size: 12px;
          text-align: center;
          margin-top: 28px;
          line-height: 1.7;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }
        .note {
          color: var(--sub);
          font-size: 11px;
          margin-top: 12px;
        }
        @media (max-width: 760px) {
          .sales-dash {
            padding: 20px 16px;
          }
          .kpis {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="head">
        <div>
          <h1>
            KD4 통합 대시보드 <span className="ptag">실시간 · Supabase</span>
          </h1>
          <div className="sub">매출(Supabase) + 스케줄표(구글시트) 월별 연동</div>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="월 선택">
          {monthKeys.map((k) => (
            <option key={k} value={k}>
              {labelByKey[k] ?? k}
            </option>
          ))}
        </select>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">{curLabel} 매출</div>
          <div className="val">
            {formatMan(curRev)}
            <span className="unit">만</span>
          </div>
          <div className={`delta ${deltaCls}`}>{deltaTxt}</div>
        </div>
        <div className="kpi">
          <div className="label">목표 달성률</div>
          <div className="val">
            {goalPct}
            <span className="unit">%</span>
          </div>
          <div className="delta warn">목표 {formatMan(GOAL_MAN)}만</div>
        </div>
        <div className="kpi">
          <div className="label">수강 (연인원)</div>
          <div className="val">
            {headcount}
            <span className="unit">명</span>
          </div>
          <div className="delta up">{classCount}개 수업/기수</div>
        </div>
        <div className="kpi">
          <div className="label">미납 건수</div>
          <div className="val">
            {unpaid.length}
            <span className="unit">건</span>
          </div>
          <div className="delta warn">
            {unpaid.length > 0 ? <><span aria-hidden="true">⚠️</span>{` ${formatMan(Math.round(unpaidTotal / 10000))}만원`}</> : '없음'}
          </div>
        </div>
      </div>

      <div className="sect"><span aria-hidden="true">📈</span> 월별 매출 추이 (단위 만원)</div>
      <div className="panel">
        <div className="bars">
          {revenue.map((r) => {
            const h = Math.round((r.man / maxMan) * 100)
            return (
              <div className="bw" key={r.key}>
                <button
                  type="button"
                  className={`bar ${r.key === selected ? 'sel' : ''}`}
                  style={{ height: `${h}%` }}
                  onClick={() => setSelected(r.key)}
                  aria-label={`${r.label} ${formatMan(r.man)}만원`}
                >
                  <span className="v">{formatMan(r.man)}</span>
                </button>
                <div className="bx">{r.key.replace('25.', '').replace('26.', '')}</div>
              </div>
            )
          })}
        </div>
        <div className="note">
          * 막대 클릭 또는 상단 월 선택으로 해당 월 강조. 2026-05부터 Supabase 자동집계, 이전은
          구글시트 과거기록.
        </div>
      </div>

      <div className="sect"><span aria-hidden="true">👥</span> {curLabel} 수강 현황 — 기수별 명단</div>
      <div className="cls">
        {schOrder.length === 0 ? (
          <div className="note">이 달 스케줄 데이터 없음</div>
        ) : (
          schOrder.map(([name, mem]) => (
            <div className="clsrow" key={name}>
              <div className="clshd">
                <span className="clsname">
                  <span aria-hidden="true">{ICON[name] || '📚'}</span>{' '}{name}
                </span>
                <span className="clscnt">{mem.length}명</span>
              </div>
              <div className="clsmem">{mem.join(' · ')}</div>
            </div>
          ))
        )}
      </div>
      <div className="note">
        * 스케줄표 구글시트 월별 탭 파싱. 손작성 비정형 시트라 일부 이름은 검증 필요할 수 있어요.
      </div>

      <div className="sect"><span aria-hidden="true">💳</span> 결제 관리</div>
      <div className="unpaid-box">
        <h3><span aria-hidden="true">⚠️</span> 미납 현황</h3>
        {unpaid.length === 0 ? (
          <div className="note" style={{ marginTop: 0 }}>
            현재 미납 건이 없습니다.
          </div>
        ) : (
          unpaid.map((u, i) => (
            <div className="urow" key={`${u.name}-${i}`}>
              <span>
                <b>{u.name}</b> · {u.className} ·{' '}
                <span className="money">{formatMan(Math.round(u.amount / 10000))}만원</span> ·{' '}
                {u.status}
              </span>
              <button type="button" className="btn">
                연락하기
              </button>
            </div>
          ))
        )}
      </div>

      <div className="foot">
        매출은 Supabase enrollments 실시간 집계 (2026-05~), 이전 월은 구글시트 과거기록 보완.
        <br />
        수강 현황은 스케줄표 월별 명단 기준.
      </div>
    </div>
  )
}
