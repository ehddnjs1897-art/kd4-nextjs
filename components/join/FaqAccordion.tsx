'use client'

import { useState } from 'react'

interface FaqItem {
  q: string
  a: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="faq-list" style={{ maxWidth: '680px', margin: '0 auto' }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className={`faq-item ${isOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="faq-question"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span>{item.q}</span>
              <span className="faq-arrow">▾</span>
            </button>
            <div className="faq-answer">{item.a}</div>
          </div>
        )
      })}
    </div>
  )
}
