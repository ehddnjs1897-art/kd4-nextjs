import type { Metadata } from 'next'
import Image from 'next/image'
import { CASTING_CARDS, castingCardWork } from '@/lib/casting-cards'
import { SITE_URL } from '@/lib/constants'
import './casting.css'

export const metadata: Metadata = {
  title: '캐스팅 현황',
  description: 'KD4 멤버들의 캐스팅 소식을 한곳에 모았습니다.',
  alternates: { canonical: `${SITE_URL}/casting` },
  openGraph: {
    title: '캐스팅 현황 | KD4 액팅 스튜디오',
    description: 'KD4 멤버들의 캐스팅 소식을 한곳에 모았습니다.',
    url: `${SITE_URL}/casting`,
    type: 'website',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
  },
}

export default function CastingPage() {
  const castingCount = CASTING_CARDS.length
  const actorCount = new Set(CASTING_CARDS.map((card) => card.name)).size

  return (
    <div className="casting-page">
      <header className="casting-hero">
        <h1>캐스팅 현황</h1>
        <p>KD4 멤버들의 캐스팅 소식을 한곳에 모았습니다.</p>
      </header>

      <div className="container casting-content">
        <p className="casting-summary">캐스팅 {castingCount}건 · 배우 {actorCount}명</p>
        <ul className="casting-grid">
          {CASTING_CARDS.map((card, index) => {
            const work = castingCardWork(card)

            return (
              <li key={card.img} className="casting-card">
                <div className="casting-card-image">
                  <Image
                    src={card.img}
                    alt={`${card.name} — ${work}`}
                    width={640}
                    height={800}
                    sizes="(max-width: 767px) calc(50vw - 32px), (max-width: 1023px) calc(33.333vw - 32px), (max-width: 1199px) calc(25vw - 30px), 270px"
                    loading={index < 4 ? 'eager' : 'lazy'}
                    fetchPriority={index < 4 ? 'high' : 'auto'}
                    draggable={false}
                  />
                </div>
                <p className="casting-card-name"><strong>{card.name}</strong></p>
                <p className="casting-card-work">{work}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
