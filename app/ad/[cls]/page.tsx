import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { CLASSES, type ClassItem } from '@/lib/classes'
import JoinForm from '@/components/contact/JoinForm'
import JoinCTALink from '@/components/join/JoinCTALink'
import dynamic from 'next/dynamic'
import AdPageView from '@/components/ad/AdPageView'
import AdClassDetail from '@/components/ad/AdClassDetail'
import AdOtherClasses from '@/components/ad/AdOtherClasses'
import { WhyKD4Section, DirectorSection, ReviewsSection, PromiseSection } from '@/components/join/JoinTrustSections'
import { AD_CLASSES, AD_KEYS, isAdKey, type AdKey } from '@/lib/ad-classes'
import styles from './ad.module.css'

const StickyBottomCTA = dynamic(() => import('@/components/join/StickyBottomCTA'))

/**
 * 광고 전용 랜딩 (2026-10-19 대표 «C안 광고전용페이지로가자»)
 * - 메타 포스터 광고 1개 = 페이지 1개. 첫 화면 = 광고에서 본 포스터 그대로 → 클래스 정보 → 신청서(클래스 미리 선택).
 * - 메뉴·푸터 없음(ConditionalShell CLEAN_ROUTES '/ad/'), 검색 노출 안 함(noindex). /join은 사이트 방문자용으로 그대로 둔다.
 * - 클래스 사실은 lib/classes.ts에서만 읽는다(가격·시간·정원 하드코딩 금지). 포스터 원본 = KD4-HUB/05-content/marketing/광고_포스터4종_2026-10/
 * - 휴대폰 우선(포스터 화면 폭 가득 → 정보 → 신청서), 넓은 화면(900px~)은 포스터 왼쪽 고정 + 정보·신청서 오른쪽 2단 (ad.module.css).
 * - 2026-10-19 대표 «정보가 없다, /join 형식 붙여서 + 하단에 다른 클래스»: 신청서 아래로
 *   ④ 이 클래스 자세히(클래스 페이지 데이터) ⑤ /join 신뢰 구간(공용 부품) ⑥ 다른 클래스 포스터 ⑦ 마지막 신청 + 하단 고정 버튼.
 */

/** classes.ts에 칸이 없는 대표 확정 안내 */
const EXTRA_NOTE: Partial<Record<AdKey, string>> = {
  audition: '회당 시간은 인원에 따라 변동될 수 있어요.', // 2026-10-15 대표 «인원수에 따라 시간 변경될 수 있음 명시»
}

type Params = Promise<{ cls: string }>

export const dynamicParams = false

export function generateStaticParams() {
  return AD_KEYS.map((cls) => ({ cls }))
}

function findClass(key: string): { key: AdKey; c: ClassItem } | null {
  if (!isAdKey(key)) return null
  const c = CLASSES.find((x) => x.nameKo === AD_CLASSES[key])
  return c ? { key, c } : null
}

/** "250,000" → "월 25만 원" */
function monthlyPrice(price: string): string {
  const n = Number(price.replace(/[^\d]/g, ''))
  if (!n) return ''
  return n % 10000 === 0 ? `월 ${n / 10000}만 원` : `월 ${n.toLocaleString('ko-KR')}원`
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { cls } = await params
  const found = findClass(cls)
  const name = found?.c.nameKo ?? '클래스'
  return {
    title: `${name} 무료 상담`,
    description: found ? `${found.c.quote} · KD4 액팅 스튜디오 ${name} 무료 상담 신청` : undefined,
    robots: { index: false, follow: false },
  }
}

export default async function AdLandingPage({ params }: { params: Params }) {
  const { cls } = await params
  const found = findClass(cls)
  if (!found) notFound()
  const { key, c } = found

  const facts = [
    c.schedule,
    `회당 ${c.duration}`,
    c.capacity && c.capacity !== '1:1' ? `정원 ${c.capacity}` : null,
    monthlyPrice(c.price),
    c.course,
  ].filter(Boolean).join(' · ')

  return (
    <div className={styles.page}>
      <AdPageView path={`/ad/${key}`} />

      <div className={styles.wrap}>
        {/* ① 광고에서 본 포스터 그대로 */}
        <div className={styles.posterCol}>
        <Image
          src={`/ads/poster-${key}.jpg`}
          alt={`KD4 액팅 스튜디오 ${c.nameKo} 포스터`}
          width={864}
          height={1080}
          priority
          sizes="(max-width: 560px) 100vw, (max-width: 899px) 560px, 460px"
          className={styles.poster}
        />
        </div>

        <div>

        {/* ② 클래스 정보 */}
        <section className={styles.info}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--navy)', margin: 0 }}>
            KD4 ACTING STUDIO · {c.nameEn.toUpperCase()}
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--navy-deep)', margin: '8px 0 6px', wordBreak: 'keep-all' }}>
            {c.nameKo}
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--gray)', lineHeight: 1.6, margin: 0, wordBreak: 'keep-all' }}>
            {c.quote}
          </p>

          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--black)', lineHeight: 1.6, margin: '16px 0 0', wordBreak: 'keep-all' }}>
            {facts}
          </p>
          {c.instructor && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--gray)', margin: '4px 0 0' }}>
              지도 · {c.instructor}
            </p>
          )}
          {(c.note || EXTRA_NOTE[key]) && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', margin: '8px 0 0', wordBreak: 'keep-all' }}>
              {[c.note, EXTRA_NOTE[key]].filter(Boolean).join(' · ')}
            </p>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
            {c.bullets.map((b) => (
              <li key={b} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--black)', display: 'flex', gap: 8, wordBreak: 'keep-all' }}>
                <span aria-hidden style={{ color: 'var(--navy)', fontWeight: 700 }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <a
            href="#form"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center', marginTop: 20, padding: '15px 16px', fontSize: '1rem', background: 'var(--navy)', color: '#fff' }}
          >
            {c.nameKo} 무료 상담 신청 ↓
          </a>
        </section>

        {/* ③ 신청서 — 지금과 같은 3단계, 클래스만 미리 선택 */}
        <section id="form" aria-label="무료 상담 신청" className={styles.formSec}>
          <JoinForm initialClass={c.nameKo} />
        </section>

        {/* ④ 폼이 부담스러운 사람을 위한 카톡 */}
        <div className={styles.kakao}>
          <JoinCTALink
            href="https://pf.kakao.com/_ximxdqn"
            kind="external"
            channel="kakao"
            location={`ad_${key}`}
            label="카카오로 먼저 물어보기"
            fireLead
            className="btn-outline"
            style={{ display: 'block', textAlign: 'center', padding: '14px 16px', borderColor: 'var(--navy)', color: 'var(--navy)' }}
          >
            카카오로 먼저 물어보기
          </JoinCTALink>
        </div>

        </div>
      </div>

      {/* ④ 이 클래스 자세히 — 클래스 페이지와 같은 데이터 */}
      <AdClassDetail adKey={key} />

      {/* ⑤ KD4를 믿을 이유 — /join과 같은 부품 */}
      <WhyKD4Section />
      <DirectorSection />
      <ReviewsSection ctaHref="#form" />
      <PromiseSection />

      {/* ⑥ 다른 클래스 포스터 */}
      <AdOtherClasses current={key} />

      {/* ⑦ 마지막 신청 + 카톡 */}
      <section aria-label="무료 상담 신청 안내" style={{ padding: 'clamp(48px, 9vw, 80px) 20px', textAlign: 'center' }}>
        <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.3rem, 3.2vw, 1.8rem)', marginBottom: 10, wordBreak: 'keep-all' }}>
          {c.nameKo}, 상담부터 편하게 시작하세요
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7, marginBottom: 22, wordBreak: 'keep-all' }}>
          이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
        </p>
        <div style={{ maxWidth: 420, margin: '0 auto', display: 'grid', gap: 10 }}>
          <a href="#form" className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '15px 16px', fontSize: '1rem', background: 'var(--navy)', color: '#fff' }}>
            {c.nameKo} 무료 상담 신청 ↑
          </a>
          <JoinCTALink
            href="https://pf.kakao.com/_ximxdqn"
            kind="external"
            channel="kakao"
            location={`ad_${key}_bottom`}
            label="카카오로 먼저 물어보기"
            fireLead
            className="btn-outline"
            style={{ display: 'block', textAlign: 'center', padding: '14px 16px', borderColor: 'var(--navy)', color: 'var(--navy)' }}
          >
            카카오로 먼저 물어보기
          </JoinCTALink>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.7, marginTop: 24, wordBreak: 'keep-all' }}>
          KD4 액팅 스튜디오 · 서울 서대문구 이화여대1안길 12 아리움3차 1층 (이대역 도보 2분)
        </p>
      </section>

      {/* 휴대폰 하단 고정 버튼 — 신청서가 화면에 보이면 자동으로 숨음 */}
      <StickyBottomCTA href="#form" label={`${c.nameKo} 무료 상담 신청`} />
    </div>
  )
}
