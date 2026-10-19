import Image from 'next/image'
import dynamic from 'next/dynamic'
import { CLASSES, SEBIN, HYUNJAE, type InstructorProfile } from '@/lib/classes'
import { MEISNER_FAQ, REEL_FAQ } from '@/lib/landing-faqs'
import {
  BASIC_AUDIENCE, BASIC_CURRICULUM, BASIC_FAQ,
  AUDITION_AUDIENCE, AUDITION_CURRICULUM, AUDITION_REVIEWS, AUDITION_FAQ,
  MEISNER_GOALS, MEISNER_PILLARS, MEISNER_CURRICULUM, MEISNER_NOTICE, MEISNER_QUOTES,
  REEL_WHY, REEL_PROCESS, REEL_CURRICULUM, REEL_INCLUDES, REEL_NOTICE,
  REEL_PORTFOLIO_VIDEOS, REEL_PORTFOLIO_PLAYLIST,
  type CurriculumMonth,
} from '@/lib/class-landing-content'
import type { AdKey } from '@/lib/ad-classes'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

/**
 * 광고 전용 랜딩 «이 클래스 자세히» (2026-10-19 대표 «/join 형식 붙여서 구체적으로 볼 수 있게»).
 * 내용은 클래스 페이지와 같은 데이터(lib/class-landing-content.ts)를 그대로 쓴다 — 새 사실을 만들지 않는다.
 * 개인 레슨은 전용 페이지가 없어 lib/classes.ts 개인 레슨 정보 + 집행 중인 광고 본문(대표 게시 승인)만 쓴다.
 */

const card: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '20px 20px',
}
const body: React.CSSProperties = { fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.75, wordBreak: 'keep-all' }
const strong: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--black)', lineHeight: 1.45, wordBreak: 'keep-all' }

function Sec({ id, eyebrow, title, alt, children }: { id?: string; eyebrow: string; title: string; alt?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="section" style={{ scrollMarginTop: 16,  background: alt ? 'var(--bg2)' : 'var(--bg)', padding: 'clamp(48px, 9vw, 80px) 0' }}>
      <div className="container">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p className="section-eyebrow"><span lang="en">{eyebrow}</span></p>
            <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.4vw, 2rem)', marginBottom: 0, wordBreak: 'keep-all' }}>
              {title}
            </h2>
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}

function Checks({ items }: { items: string[] }) {
  return (
    <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
      {items.map((t) => (
        <li key={t} style={{ ...card, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span aria-hidden style={{ color: 'var(--navy)', fontWeight: 700 }}>✓</span>
          <span style={{ ...body, color: 'var(--black)' }}>{t}</span>
        </li>
      ))}
    </ul>
  )
}

function Months({ months }: { months: CurriculumMonth[] }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {months.map((m) => (
        <div key={m.month} style={card}>
          <p style={strong}>{m.emoji} {m.month}</p>
          {m.goal && <p style={{ ...body, marginTop: 4 }}>{m.goal}</p>}
          <ol style={{ margin: '10px 0 0', paddingLeft: 18 }}>
            {m.sessions.map((s, i) => (
              <li key={`${s.title}-${i}`} style={{ ...body, color: s.highlight ? 'var(--navy)' : 'var(--black)', fontWeight: s.highlight ? 700 : 400 }}>
                {s.title}
                {s.detail && <span style={{ color: 'var(--gray-light)', fontWeight: 400 }}> · {s.detail}</span>}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

function Quotes({ items }: { items: { text: string; who: string }[] }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((q) => (
        <figure key={q.text.slice(0, 20)} style={{ ...card, margin: 0 }}>
          <blockquote style={{ ...body, color: 'var(--black)', margin: 0 }}>&ldquo;{q.text}&rdquo;</blockquote>
          <figcaption style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: 8 }}>— {q.who}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function Notice({ items }: { items: string[] }) {
  return (
    <ul style={{ ...card, margin: '16px 0 0', paddingLeft: 36 }}>
      {items.map((t) => (
        <li key={t} style={body}>{t}</li>
      ))}
    </ul>
  )
}

function Coach({ p }: { p: InstructorProfile }) {
  return (
    <div style={{ ...card, display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 120, aspectRatio: p.photoAspect, borderRadius: 10, overflow: 'hidden', flex: 'none', background: 'var(--bg2)' }}>
        <Image src={p.photo} alt={`${p.name} 액팅 코치`} fill sizes="120px" style={{ objectFit: 'contain' }} />
      </div>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <p style={strong}>{p.name} <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 400, color: 'var(--gray)' }}>{p.nameEn}</span></p>
        <p style={{ fontSize: '0.82rem', color: 'var(--navy)', fontWeight: 600, marginTop: 2 }}>{p.title}</p>
        {(p.awards ?? []).slice(0, 1).map((a) => (
          <p key={a} style={{ ...body, marginTop: 8 }}>{a}</p>
        ))}
        {p.filmographySections.slice(0, 1).map((s) => (
          <ul key={s.label} style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {s.items.slice(0, 4).map((it) => (
              <li key={it} style={{ ...body, fontSize: '0.85rem' }}>{it}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Sec eyebrow="FAQ" title="자주 묻는 질문">
      <FaqAccordion items={items} />
    </Sec>
  )
}

export default function AdClassDetail({ adKey }: { adKey: AdKey }) {
  if (adKey === 'basic') {
    return (
      <>
        <Sec eyebrow="FOR WHOM" title="누구를 위한 클래스인가" alt>
          <div style={{ display: 'grid', gap: 12 }}>
            {BASIC_AUDIENCE.map((a) => (
              <div key={a.title} style={card}>
                <p style={strong}>{a.title}</p>
                <p style={{ ...body, marginTop: 4 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </Sec>
        <Sec eyebrow="CURRICULUM" title="3개월 커리큘럼">
          <div style={{ display: 'grid', gap: 12 }}>
            {BASIC_CURRICULUM.map((m) => (
              <div key={m.month} style={card}>
                <p style={strong}>{m.month} · {m.theme}</p>
                <p style={{ ...body, marginTop: 4 }}>{m.lead}</p>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
                  {m.items.map((it) => <li key={it} style={{ ...body, color: 'var(--black)' }}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Sec>
        <Faq items={BASIC_FAQ} />
      </>
    )
  }

  if (adKey === 'audition') {
    return (
      <>
        <Sec eyebrow="FOR WHOM" title="이런 분께 추천합니다" alt>
          <Checks items={AUDITION_AUDIENCE} />
        </Sec>
        <Sec eyebrow="CURRICULUM" title="3개월 커리큘럼">
          <div style={{ display: 'grid', gap: 12 }}>
            {AUDITION_CURRICULUM.map((m) => (
              <div key={m.month} style={card}>
                <p style={strong}>{m.month} · {m.title}</p>
                <p style={{ ...body, marginTop: 4 }}>{m.goal}</p>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
                  {m.weeks.map((w) => (
                    <li key={w.w} style={{ ...body, color: 'var(--black)' }}>
                      <b>{w.w} · {w.h}</b> <span style={{ color: 'var(--gray-light)' }}>{w.d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Sec>
        <Sec eyebrow="ACTING COACH" title="액팅 코치" alt>
          <Coach p={SEBIN} />
        </Sec>
        <Sec eyebrow="REVIEWS" title="참여 배우 후기">
          <Quotes items={AUDITION_REVIEWS.map((r) => ({ text: r.body, who: r.who }))} />
        </Sec>
        <Faq items={AUDITION_FAQ} />
      </>
    )
  }

  if (adKey === 'meisner') {
    return (
      <>
        <Sec eyebrow="CLASS GOALS" title="수업 목표" alt>
          <Checks items={MEISNER_GOALS} />
        </Sec>
        <Sec eyebrow="THE METHOD" title="마이즈너 테크닉이란">
          <div style={{ display: 'grid', gap: 12 }}>
            {MEISNER_PILLARS.map(({ Icon, title, desc }) => (
              <div key={title} style={{ ...card, display: 'flex', gap: 14 }}>
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} aria-hidden style={{ flex: 'none', marginTop: 2 }} />
                <div>
                  <p style={strong}>{title}</p>
                  <p style={{ ...body, marginTop: 4 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Sec>
        <Sec eyebrow="4 MONTHS" title="4개월 정규 코스" alt>
          <Months months={MEISNER_CURRICULUM} />
          <Notice items={MEISNER_NOTICE} />
        </Sec>
        <Sec eyebrow="VOICES" title="오픈클래스에 다녀간 멤버들의 말">
          <Quotes items={MEISNER_QUOTES.map((q) => ({ text: q.text, who: q.author }))} />
        </Sec>
        <Faq items={MEISNER_FAQ} />
      </>
    )
  }

  if (adKey === 'reel') {
    return (
      <>
        {/* 2026-10-19 대표 «출연영상 클래스는 포트폴리오도 넣어» — 클래스 페이지와 같은 영상, 최근 4편 + 재생목록 */}
        <Sec id="portfolio" eyebrow="PORTFOLIO" title="포트폴리오" alt>
          <p style={{ ...body, textAlign: 'center', marginTop: -12, marginBottom: 20 }}>
            KD4 멤버가 전문 영화팀과 촬영·편집한 출연영상입니다.
          </p>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
            {REEL_PORTFOLIO_VIDEOS.slice(0, 4).map((v) => (
              <div key={v.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <YouTubeFacade videoId={v.id} title={v.title} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href={REEL_PORTFOLIO_PLAYLIST} target="_blank" rel="noopener noreferrer" aria-label="출연영상 포트폴리오 YouTube 재생목록 (새 탭에서 열림)" className="btn-primary" style={{ background: 'var(--navy)', color: '#fff' }}>
              포트폴리오 더보기 (유튜브 재생목록) <span aria-hidden="true">→</span>
            </a>
          </div>
        </Sec>
        <Sec eyebrow="WHY REEL" title="왜 출연영상이 필요한가">
          <div style={{ display: 'grid', gap: 12 }}>
            {REEL_WHY.map(({ Icon, title, desc }) => (
              <div key={title} style={{ ...card, display: 'flex', gap: 14 }}>
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} aria-hidden style={{ flex: 'none', marginTop: 2 }} />
                <div>
                  <p style={strong}>{title}</p>
                  <p style={{ ...body, marginTop: 4 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Sec>
        <Sec eyebrow="PROCESS" title="제작 4단계" alt>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
            {REEL_PROCESS.map((p) => (
              <div key={p.num} style={card}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--navy)', fontWeight: 700 }}>{p.num}</p>
                <p style={{ ...strong, marginTop: 4 }}>{p.title}</p>
                <p style={{ ...body, marginTop: 4 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </Sec>
        <Sec eyebrow="3 MONTHS" title="3개월 코스">
          <Months months={REEL_CURRICULUM} />
          <Notice items={REEL_NOTICE} />
        </Sec>
        <Sec eyebrow="INCLUDED" title="포함 사항" alt>
          <Checks items={REEL_INCLUDES.filter((i) => i.yes).map((i) => i.text)} />
        </Sec>
        <Faq items={REEL_FAQ} />
      </>
    )
  }

  // 개인 레슨 — 전용 페이지 없음: lib/classes.ts 정보 + 게시 중인 광고 본문만
  const priv = CLASSES.find((c) => c.nameKo === '개인 레슨')
  return (
    <>
      <Sec eyebrow="1:1 LESSON" title="나만을 위한 집중 훈련" alt>
        <p style={{ ...body, color: 'var(--black)', textAlign: 'center', marginBottom: 20 }}>
          막힌 연기, 1:1로 함께 풀어요. 오디션 준비, 독백 만들기, 이미지 컨설팅까지 지금 나에게 필요한 연기에 집중합니다.
        </p>
        <Checks items={priv?.bullets ?? []} />
      </Sec>
      <Sec eyebrow="ACTING COACHES" title="액팅 코치">
        <div style={{ display: 'grid', gap: 12 }}>
          <Coach p={SEBIN} />
          <Coach p={HYUNJAE} />
        </div>
      </Sec>
    </>
  )
}
