import type { Metadata } from 'next'
import {
  Users,
  Calendar,
  UserCheck,
  Repeat,
  Zap,
  FileText,
  Film,
  Check,
  X,
  ArrowRight,
  Quote,
  Star,
  MessageCircle,
  Clock,
  ShieldCheck,
  HeartHandshake,
  Camera,
  Moon,
  Wallet,
} from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import { FAQ_ITEMS } from '@/lib/faq-items'
import JoinForm from '@/components/contact/JoinForm'
import StickyTopBar from '@/components/join/StickyTopBar'
import StickyBottomCTA from '@/components/join/StickyBottomCTA'
import FaqAccordion from '@/components/join/FaqAccordion'

export const metadata: Metadata = {
  title: '무료 상담 신청 | KD4 액팅 스튜디오',
  description: '소수정예 마이즈너 테크닉 연기 클래스. 봄맞이 첫 달 10만원 할인. 서울 신촌.',
  robots: { index: false, follow: false },
}

/* ── 상수 ────────────────────────────────────────────────────────── */
const INSTRUCTOR_IMG =
  'https://drive.google.com/uc?export=view&id=1WfyN6x21sRLNzzNNYB-dBschGRzdEzUP'
const STUDIO_IMG =
  'https://drive.google.com/uc?export=view&id=1by0ZDO3J5yS-44McKbmAPixjPtI3xWNr'
const DEADLINE = '2026-04-30T23:59:59'

/* 마이즈너 소개 영상 YouTube ID — 없으면 스튜디오 사진으로 대체 */
const MEISNER_VIDEO_ID = '' // 예: 'dQw4w9WgXcQ'

/* ── lib/classes.ts 데이터 재사용 ─────────────────────────────────── */
const OPEN_CLASSES = CLASSES.filter((c) => c.isNewMemberOpen && c.highlight)
const TOTAL_SEATS = OPEN_CLASSES.reduce((s, c) => s + (c.remainingSeats ?? 0), 0)
const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!
const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

/* 봄할인: 첫 달만 적용 */
const MONTH_SAVING = 100000

/* ── Agitation 감정 체크리스트 3개 ────────────────────────────── */
const PAIN_POINTS = [
  {
    Icon: Camera,
    title: '카메라 앞에서 머리가 하얘진 경험',
    desc: '대사는 다 외웠는데, 슛 들어가는 순간 아무것도 안 나와요. 분명 집에선 됐는데.',
  },
  {
    Icon: Moon,
    title: '오디션 떨어지고 자존감 무너진 밤',
    desc: '떨어지고 집에 오는 길이 제일 힘들어요. 재능이 없나, 생각 안 하려 해도 자꾸 해요.',
  },
  {
    Icon: Wallet,
    title: '월 학원비 본전 생각에 잠 못 이룬 새벽',
    desc: '한 반에 20명인데 내 순서는 5분. 매달 돈 내면서 이게 맞나 싶어요.',
  },
]

/* ── 커리큘럼 4개월 로드맵 ──────────────────────────────────── */
const CURRICULUM = [
  {
    Icon: Repeat,
    month: 'MONTH 01',
    title: 'Repetition',
    subtitle: '레피티션',
    desc: '상대를 보고 느끼는 그대로 반응하는 훈련. "정답 연기"를 내려놓는 것부터 시작해요.',
  },
  {
    Icon: Zap,
    month: 'MONTH 02',
    title: 'Activity & Doorknock',
    subtitle: '7단계 실습',
    desc: '마이즈너 테크닉의 핵심인 Activity & Doorknock 7단계. 몸이 먼저 알아채는 연기를 만들어요.',
  },
  {
    Icon: FileText,
    month: 'MONTH 03',
    title: 'Text & Memorizing',
    subtitle: '텍스트 분석 · 메모라이징',
    desc: '대본을 외우는 게 아니라 읽는 법. 인물이 진짜 원하는 게 뭔지 찾아내는 단계예요.',
  },
  {
    Icon: Film,
    month: 'MONTH 04',
    title: 'Emotional Freedom',
    subtitle: '감정 해방 · 충동과 본능',
    desc: '연기하려 하지 않아도 장면이 살아나는 경험. 충동과 본능을 회복하는 마지막 단계예요.',
  },
]

/* ── 비교표 ────────────────────────────────────────────────── */
const COMPARISON_ROWS: { label: string; normal: string; kd4: string }[] = [
  { label: '정원', normal: '20~30명', kd4: '6~8명 프라이빗' },
  { label: '강사', normal: '조교·보조 강사', kd4: '현역 배우 직강' },
  { label: '포트폴리오 제작', normal: '선택 · 추가 비용', kd4: '정규 과정 포함' },
  { label: '캐스팅 연계', normal: 'X', kd4: 'O' },
  { label: '월 수강료', normal: '20~35만원', kd4: '25만원' },
]

/* ── 후기 (신뢰도 보강 — 기수/나이대 추가) ────────────────── */
const REVIEWS = [
  {
    text: '정답인 연기를 요구하지 않고, 저 자체로 보여줄 수 있는 연기를 할 수 있었어요',
    author: '윤*숙',
    meta: '2025 봄 기수 · 마이즈너 정규반',
  },
  {
    text: '마이즈너 테크닉을 처음 접했습니다. 진짜 연기가 뭔지 발견했습니다',
    author: '김*현',
    meta: '2024 가을 기수 · 출연영상반',
  },
  {
    text: '한 사람 한 사람에게 디테일한 피드백을 주신다는 점이 가장 좋았습니다',
    author: '정*석',
    meta: '2025 봄 기수 · 마이즈너 정규반',
  },
]

/* ── Risk Reversal 3가지 보장 ─────────────────────────────── */
const GUARANTEES = [
  {
    Icon: HeartHandshake,
    title: '상담 후 바로 가셔도 돼요',
    desc: '30분 편하게 이야기 나눠보고, 아니다 싶으면 그냥 가셔도 됩니다. 등록 권유 없어요.',
  },
  {
    Icon: ShieldCheck,
    title: '첫 수업 듣고 아니면 전액 환불',
    desc: '첫 수업 듣고 맞지 않는다고 느끼시면 카카오로 말씀해 주세요. 군말 없이 전액 돌려드립니다.',
  },
  {
    Icon: FileText,
    title: '상담만 받아도 가이드 PDF',
    desc: '권동원 대표가 직접 쓴 오디션 합격 가이드, 오시는 분 모두 무료로 드려요.',
  },
]

/* ══════════════════════════════════════════════════════════════════ */

export default function JoinPage() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        color: '#111111',
        paddingBottom: '90px',
      }}
    >
      <StickyTopBar deadline={DEADLINE} seats={TOTAL_SEATS} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ① HERO — 강사 사진 + 세리프 헤드라인                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          position: 'relative',
          minHeight: '560px',
          overflow: 'hidden',
          background: 'var(--bg-deep)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={INSTRUCTOR_IMG}
          alt="권동원 대표 — KD4 액팅 스튜디오"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 15%',
            opacity: 0.62,
            filter: 'grayscale(0.2)',
          }}
        />
        {/* 상단은 가볍게, 하단은 진하게 — 얼굴이 보이면서 텍스트도 읽히도록 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,20,35,0.35) 0%, rgba(15,20,35,0.55) 45%, rgba(15,20,35,0.85) 100%)',
          }}
          aria-hidden="true"
        />

        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: 'clamp(72px, 14vw, 120px) 24px clamp(60px, 10vw, 90px)',
            textAlign: 'center',
          }}
        >
          <p
            className="section-eyebrow"
            style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}
          >
            KD4 ACTING STUDIO · 무료 상담
          </p>

          <h1
            className="section-title-serif"
            style={{
              fontSize: 'clamp(1.8rem, 4.8vw, 2.8rem)',
              color: '#ffffff',
              lineHeight: 1.35,
              marginBottom: '22px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            우리는 양산형 학원이 아닙니다.
            <br />
            <span
              style={{
                color: '#ffffff',
                borderBottom: '2px solid var(--navy-accent)',
                paddingBottom: '2px',
              }}
            >
              배우를 성장시키는 &apos;KD4 액팅스튜디오&apos;입니다.
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)',
              color: 'rgba(255,255,255,0.86)',
              lineHeight: 1.65,
              marginBottom: '10px',
              maxWidth: '520px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
            }}
          >
            틀에 박힌 연기, 공장식 수업에서 벗어나고 싶은
            <br />
            배우를 위한 스튜디오
          </p>
          <p
            style={{
              fontSize: 'clamp(0.8rem, 2vw, 0.88rem)',
              color: 'rgba(255,255,255,0.50)',
              lineHeight: 1.75,
              marginBottom: '36px',
              maxWidth: '460px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            서울 신촌 · 6~8명 소수정예 마이즈너 테크닉 정규 클래스
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="#form"
              className="btn-primary"
              style={{ background: 'var(--navy)', color: '#ffffff' }}
            >
              무료 상담 신청하기
              <ArrowRight size={16} strokeWidth={2.2} />
            </a>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <MessageCircle size={14} strokeWidth={2.2} />
              카카오 문의
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ② AGITATION — 감정 체크리스트 3개 카드 (Round 1 반영)     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0',
          background: 'var(--bg2)',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={STUDIO_IMG}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.07,
            filter: 'grayscale(1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, var(--bg2) 0%, rgba(232,232,223,0.85) 40%, var(--bg2) 100%)',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — THE PROBLEM</p>
            <h2
              className="section-title-serif"
              style={{
                fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
                lineHeight: 1.45,
                marginBottom: '18px',
              }}
            >
              혹시 이런 경험, 있지 않으세요?
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--gray-light)',
                lineHeight: 1.8,
                maxWidth: '540px',
                margin: '0 auto',
              }}
            >
              재능이 부족해서가 아닙니다. 배우는 방법이 틀렸을 뿐이에요.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            {PAIN_POINTS.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '26px 22px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--accent-red-soft)',
                    border: '1px solid rgba(199,62,62,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={20} color="var(--accent-red)" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ③ SOLUTION — 마이즈너 테크닉                              */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="method" className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — THE METHOD</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '20px' }}
            >
              그래서 KD4는 <span style={{ color: 'var(--navy)' }}>마이즈너 테크닉</span>을 씁니다
            </h2>
            <p
              className="section-desc"
              style={{ margin: '0 auto 48px', textAlign: 'center', maxWidth: '560px' }}
            >
              혼자 감정을 만드는 연기가 아닙니다. 상대에게 집중하고 그 순간 반응하는, 가장 자연스러운 연기 훈련법입니다.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                textAlign: 'left',
              }}
            >
              {[
                { Icon: Users, n: '01', t: '레피티션', d: '상대를 보고 느끼는 그대로 반응해요. 만들어낸 감정이 아니라, 진짜 일어난 감정.' },
                { Icon: Zap, n: '02', t: '액티비티', d: '집중할 과제를 주고 연기를 잊게 해요. 몸이 먼저 반응하면 연기는 저절로 따라와요.' },
                { Icon: FileText, n: '03', t: '텍스트 분석', d: '대사를 외우는 게 아니라 읽는 법을 배워요. 인물이 왜 이 말을 하는지부터 찾아요.' },
              ].map(({ Icon, n, t, d }) => (
                <div
                  key={n}
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '26px 24px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'rgba(21,72,138,0.08)',
                      border: '1px solid rgba(21,72,138,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    <Icon size={20} color="var(--navy)" strokeWidth={1.8} />
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      color: 'var(--navy)',
                      marginBottom: '8px',
                    }}
                  >
                    {n}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    {t}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.6 }}>
                    {d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ③.5 MEISNER VIDEO / PHOTO                                  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'var(--bg-deep)', padding: '0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {MEISNER_VIDEO_ID ? (
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${MEISNER_VIDEO_ID}?rel=0&modestbranding=1`}
                title="마이즈너 테크닉 소개"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>
          ) : (
            <div style={{ position: 'relative', overflow: 'hidden', minHeight: '380px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STUDIO_IMG}
                alt="KD4 액팅 스튜디오 — 마이즈너 테크닉 수업"
                style={{
                  width: '100%',
                  height: '380px',
                  objectFit: 'cover',
                  objectPosition: 'center 40%',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(10,15,30,0.25) 0%, rgba(10,15,30,0.72) 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '40px 36px',
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.25em',
                      color: 'rgba(255,255,255,0.55)',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Meisner Technique
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
                      color: '#ffffff',
                      lineHeight: 1.55,
                      maxWidth: '520px',
                    }}
                  >
                    "연기는 상대방에게 사는 것이다"
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        color: 'rgba(255,255,255,0.5)',
                        fontFamily: 'var(--font-sans)',
                        fontStyle: 'normal',
                        marginTop: '8px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      — Sanford Meisner
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ④ STATS                                                    */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="stats-banner">
        <div className="container">
          <div className="stats-grid">
            {[
              { Icon: Users, num: '400+', label: '누적 코칭 배우' },
              { Icon: Calendar, num: '3년+', label: '스튜디오 운영' },
              { Icon: UserCheck, num: '6~8명', label: '소수정예 정원' },
            ].map(({ Icon, num, label }) => (
              <div key={num} className="stats-card">
                <div className="stats-icon-wrap">
                  <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <div className="stat-num">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑤ DIRECTOR — 강사 크레딧 구체화 + 인라인 CTA              */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">03 — THE TEACHER</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
            >
              현장에서 일하는 배우가 가르칩니다
            </h2>
          </div>

          <div className="director-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="director-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={INSTRUCTOR_IMG}
                alt="권동원 대표"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="director-name">권동원</div>
              <div className="director-role">KD4 대표 · 현역 배우</div>
              <div className="director-creds">
                <div className="director-cred">
                  LA Meisner Technique Studio 정식 2년 과정 수료
                </div>
                <div className="director-cred">Disney+ 무빙 시즌2 조연 출연 (2024)</div>
                <div className="director-cred">SBS 중증외상센터 조연 출연 (2024)</div>
                <div className="director-cred">2022~2026 400명 이상 배우 직접 코칭</div>
              </div>
              <p
                style={{
                  marginTop: '22px',
                  paddingLeft: '14px',
                  borderLeft: '2px solid var(--navy)',
                  fontStyle: 'italic',
                  fontSize: '0.92rem',
                  color: 'var(--gray-light)',
                  lineHeight: 1.8,
                }}
              >
                학원 선생님이 아닌, 같이 현장에서 일하는 동료로서 가르칩니다. 이론만이 아니라 지금 촬영장에서 통하는 연기를 공유해요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑥ PROOF — 후기 (신뢰도 보강) + 인라인 CTA                 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">04 — KD4 배우 이야기</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
            >
              이미 방법을 바꾼 사람들
            </h2>
          </div>

          <div className="testimonials-grid">
            {REVIEWS.map(({ text, author, meta }) => (
              <div key={author} className="testimonial-card">
                <div style={{ display: 'flex', gap: '2px', marginBottom: '14px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      color="#F59E0B"
                      fill="#F59E0B"
                      strokeWidth={1.3}
                    />
                  ))}
                </div>
                <Quote
                  size={24}
                  color="var(--navy)"
                  strokeWidth={1.3}
                  style={{ opacity: 0.25, marginBottom: '8px' }}
                />
                <p
                  style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.85,
                    color: 'var(--gray-light)',
                    marginBottom: '20px',
                  }}
                >
                  {text}
                </p>
                <div className="testimonial-name">{author}</div>
                <div className="testimonial-class">{meta}</div>
              </div>
            ))}
          </div>

          {/* 인라인 CTA */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <a
              href="#form"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--navy)',
                borderBottom: '1px solid var(--navy)',
                padding: '4px 0',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              나도 이 방법으로 바꿔보기
              <ArrowRight size={14} strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑦ CURRICULUM — 4개월 로드맵                               */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 48px', textAlign: 'center' }}>
            <p className="section-eyebrow">05 — CURRICULUM</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '16px' }}
            >
              4개월 주차별 로드맵
            </h2>
            <p className="section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
              추상적인 약속이 아니라, 매달 구체적으로 무엇을 배우는지 공개합니다.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              maxWidth: '1080px',
              margin: '0 auto',
            }}
          >
            {CURRICULUM.map(({ Icon, month, title, subtitle, desc }) => (
              <div
                key={month}
                className="step-card"
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '32px 24px',
                }}
              >
                <div className="step-icon-glow" style={{ marginBottom: '20px' }}>
                  <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    color: 'var(--navy)',
                    marginBottom: '12px',
                  }}
                >
                  {month}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--navy)',
                    marginBottom: '14px',
                    fontWeight: 500,
                  }}
                >
                  {subtitle}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.75 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑧ COMPARISON                                                */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">06 — COMPARE</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
            >
              대형 학원 vs KD4
            </h2>
          </div>

          <div className="comparison-wrap" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}></th>
                  <th>대형 학원</th>
                  <th className="kd4-col">KD4</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td style={{ color: 'var(--gray)' }}>
                      {row.normal === 'X' ? (
                        <X size={18} color="var(--gray)" strokeWidth={2.2} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      ) : (
                        row.normal
                      )}
                    </td>
                    <td className="kd4-col">
                      {row.kd4 === 'O' ? (
                        <Check size={18} color="var(--navy)" strokeWidth={2.2} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      ) : (
                        row.kd4
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑨ OFFER — 가격 + 카운트다운 + Anchor Price 배지           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">07 — SPRING SPECIAL</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '14px' }}
            >
              봄맞이 스페셜 혜택
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              전체 <strong style={{ color: 'var(--navy)' }}>{TOTAL_SEATS}석</strong>만 남았습니다 · 마감 후 정가 복귀
            </p>
          </div>

          {/* 절감액 배지 */}
          <div
            style={{
              maxWidth: '520px',
              margin: '0 auto 24px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                background: 'var(--accent-red-soft)',
                border: '1px solid rgba(199,62,62,0.25)',
                borderRadius: 'var(--radius)',
                padding: '10px 16px',
                fontSize: '0.82rem',
                color: 'var(--accent-red)',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              첫 달 {MONTH_SAVING.toLocaleString()}원 할인
            </div>
            <div
              style={{
                background: 'rgba(21,72,138,0.08)',
                border: '1px solid rgba(21,72,138,0.25)',
                borderRadius: 'var(--radius)',
                padding: '10px 16px',
                fontSize: '0.82rem',
                color: 'var(--navy)',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              이후 정가 복귀 · 마감 후 신청 불가
            </div>
          </div>

          {/* 잔여석 표시 */}
          <div
            style={{
              background: 'var(--bg2)',
              border: '1px solid rgba(199,62,62,0.3)',
              borderRadius: 'var(--radius)',
              padding: '28px 20px',
              maxWidth: '520px',
              margin: '0 auto 28px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                color: 'var(--accent-red)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Clock size={13} strokeWidth={1.8} />
              이번 기수 남은 자리
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 6vw, 3rem)',
                fontWeight: 900,
                color: 'var(--accent-red)',
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {TOTAL_SEATS}자리
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.04em' }}>
              소수정예 7~8명 정원 · 마감 후 정가 복귀
            </p>
          </div>

          {/* 클래스 카드 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            {[MAIN_CLASS, FILM_CLASS].map((cls) => (
              <div key={cls.nameKo} className="class-card">
                <div className="class-card-header">
                  <p className="class-step">{cls.step}</p>
                  <p className="class-name-ko">{cls.nameKo}</p>
                  <p className="class-name-en">{cls.nameEn}</p>
                </div>
                <div className="class-card-body">
                  {cls.quote && <p className="class-quote">{cls.quote}</p>}
                  <div className="class-bullets">
                    {cls.bullets.slice(0, 3).map((b) => (
                      <div key={b} className="class-bullet">
                        {b}
                      </div>
                    ))}
                  </div>
                  {cls.remainingSeats !== undefined && (
                    <p
                      className="class-note"
                      style={{
                        color: 'var(--accent-red)',
                        background: 'var(--accent-red-soft)',
                        borderColor: 'rgba(199,62,62,0.2)',
                      }}
                    >
                      잔여석 {cls.remainingSeats}석
                    </p>
                  )}
                </div>
                <div className="class-card-footer">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '10px',
                      marginBottom: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="class-price">
                      {cls.price}<span>원/월</span>
                    </span>
                    {cls.originalPrice && (
                      <span
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--gray)',
                          textDecoration: 'line-through',
                        }}
                      >
                        {cls.originalPrice}원
                      </span>
                    )}
                  </div>
                  {/* 코스 총액 — 첫 달 할인가 + 나머지 정가 합산 */}
                  {cls.course && (() => {
                    const months = parseInt(cls.course.match(/\d+/)?.[0] ?? '1')
                    const discounted = parseInt(cls.price.replace(/,/g, ''))
                    const regular = cls.originalPrice
                      ? parseInt(cls.originalPrice.replace(/,/g, ''))
                      : discounted
                    const total = discounted + regular * (months - 1)
                    return (
                      <p style={{ fontSize: '0.78rem', color: 'var(--gray-light)', marginBottom: '6px' }}>
                        {cls.course} 총{' '}
                        <strong style={{ color: 'var(--navy)' }}>
                          {total.toLocaleString()}원
                        </strong>
                        {' '}· 분납 상담 가능
                      </p>
                    )
                  })()}
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                    {cls.schedule} · {cls.duration} · 정원 {cls.capacity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <a href="#form" className="btn-primary" style={{ background: 'var(--navy)', color: '#ffffff' }}>
              무료 상담 신청하기
              <ArrowRight size={16} strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑩ FAQ                                                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">08 — FAQ</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
            >
              자주 묻는 질문
            </h2>
          </div>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑪ RISK REVERSAL — 신규 (Form 직전 리스크 제거)            */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">09 — OUR PROMISE</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', marginBottom: '16px' }}
            >
              상담만 받아도 괜찮아요
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              부담 없는 30분 대화. 본인에게 맞는지 확인만 하고 가셔도 됩니다.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            {GUARANTEES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '28px 24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(21,72,138,0.08)',
                    border: '1px solid rgba(21,72,138,0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* 배우 갤러리 선택적 링크 — 신청 전 스튜디오 배우들 확인 */}
          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <a
              href="/actors"
              style={{
                fontSize: '0.82rem',
                color: 'var(--gray)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '2px',
                letterSpacing: '0.02em',
              }}
            >
              수강 전 KD4 배우들을 먼저 보고 싶다면 → 배우 갤러리 보기
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑫ FORM — 신청 폼                                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="form"
        className="section"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, var(--bg) 70%)',
          padding: '100px 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p className="section-eyebrow">10 — START HERE</p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: '10px' }}
              >
                무료 상담 신청하기
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                30초면 충분해요. 24시간 이내 카카오로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑬ FOOTER 안심 문구                                         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '60px 0 40px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.7 }}>
            개인정보는 상담 연락 외에 사용되지 않습니다.
          </p>
          <div style={{ marginTop: '24px' }}>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}
            >
              <MessageCircle size={14} strokeWidth={2.2} />
              카카오로 바로 문의
            </a>
          </div>
          <p
            style={{
              marginTop: '36px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.72rem',
              color: 'var(--gray)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            KD4 ACTING STUDIO · 서울 서대문구 신촌
          </p>
        </div>
      </section>

      <StickyBottomCTA />
    </div>
  )
}
