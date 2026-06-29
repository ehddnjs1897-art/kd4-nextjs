'use client'

import { useEffect, useRef } from 'react'

export default function PostHtmlContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    // DOMPurify는 브라우저에서만 동작 — 클라이언트에서 sanitize 후 주입
    import('dompurify').then(({ default: DOMPurify }) => {
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h2', 'h3', 'ul', 'ol', 'li', 'hr', 'img', 'a'],
        ALLOWED_ATTR: ['src', 'alt', 'href', 'target', 'rel'],
      })
      if (ref.current) ref.current.innerHTML = clean
    })
  }, [html])

  return (
    <div
      ref={ref}
      className="post-html-content"
      style={{ fontSize: '0.95rem', color: 'var(--white)', lineHeight: 1.9, minHeight: '200px', marginBottom: '16px' }}
    />
  )
}
