import type { InstantKey } from '@/lib/join-instant'

/** Approved six line icons. Decorative: the adjacent class label names the link. */
export default function JoinClassIcon({ kind, className }: { kind: InstantKey; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" width="40" height="40" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      {kind === 'basic' && <path d="M12 19h24l9 9v28H12z M36 19v11h9 M21 38h1 M34 38h1 M21 45q7 7 14 0 M49 7l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />}
      {kind === 'meisner' && <path d="M8 52v-9q-5-5-4-14q0-10 11-10q9 0 10 9l4 6-5 2v8h-8 M56 52v-9q5-5 4-14q0-10-11-10q-9 0-10 9l-4 6 5 2v8h8 M25 10h14 M35 6l4 4-4 4 M39 55H25 M29 51l-4 4 4 4" />}
      {kind === 'reel' && <path d="M10 27h44v27H10z M10 27L8 17 49 7l3 11z M20 14l9 8 M35 10l9 8 M10 36h44" />}
      {kind === 'audition' && <path transform="translate(0 8)" d="M32 6l5 11 12 2-9 9 2 13-10-6-11 6 3-13-9-9 12-2z" />}
      {kind === 'private' && <><circle cx="32" cy="23" r="8" /><path d="M17 50v-5c0-8 30-8 30 0v5 M9 21V9h12 M43 9h12v12 M55 43v12H43 M21 55H9V43" /></>}
      {kind === 'recommend' && <><circle cx="32" cy="32" r="23" /><path d="M42 22l-6 14-14 6 6-14z" /></>}
    </svg>
  )
}
