import Image from 'next/image'
import Link from 'next/link'
import { CLASSES } from '@/lib/classes'
import { AD_CLASSES, AD_KEYS, type AdKey } from '@/lib/ad-classes'

/**
 * 광고 전용 랜딩 하단 «다른 클래스도 있어요» (2026-10-19 대표 «하단에 다른 클래스 포스터들과, 다른 클래스도 신청할 수 있게»).
 * 포스터를 누르면 그 클래스의 광고 전용 페이지로. 신청서 2단계에서도 클래스를 바꿔 신청할 수 있다.
 */
export default function AdOtherClasses({ current }: { current: AdKey }) {
  const others = AD_KEYS.filter((k) => k !== current)
  return (
    <section className="section" aria-label="다른 클래스" style={{ background: 'var(--bg2)', padding: 'clamp(48px, 9vw, 80px) 0' }}>
      <div className="container">
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <p className="section-eyebrow"><span lang="en">MORE CLASSES</span></p>
            <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.4vw, 2rem)', marginBottom: 8 }}>
              다른 클래스도 있어요
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
              포스터를 누르면 자세히 볼 수 있어요. 신청서에서 다른 클래스로 바꿔 신청해도 됩니다.
            </p>
          </div>
          <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(min(46%, 210px), 1fr))' }}>
            {others.map((k) => {
              const c = CLASSES.find((x) => x.nameKo === AD_CLASSES[k])
              return (
                <li key={k}>
                  <Link href={`/ad/${k}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    <Image
                      src={`/ads/poster-${k}.jpg`}
                      alt={`${AD_CLASSES[k]} 포스터`}
                      width={864}
                      height={1080}
                      sizes="(max-width: 600px) 46vw, 220px"
                      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, boxShadow: '0 6px 18px rgba(22,35,59,0.12)' }}
                    />
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 700, marginTop: 10, wordBreak: 'keep-all' }}>{AD_CLASSES[k]}</p>
                    {c && <p style={{ fontSize: '0.8rem', color: 'var(--gray-light)', marginTop: 2, wordBreak: 'keep-all' }}>{c.quote}</p>}
                    <p style={{ fontSize: '0.82rem', color: 'var(--navy)', fontWeight: 700, marginTop: 6 }}>자세히 보기 →</p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
