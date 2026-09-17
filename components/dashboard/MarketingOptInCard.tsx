'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CONSENT_VERSION } from '@/lib/consent'

/**
 * 오디션·개강 소식 수신 동의 (선택) — 기존 가입자용 (2026-09-17 대표 승인).
 * 가입자 193명 중 동의 4명뿐이라 개강 안내(광고성 정보)를 보낼 수 없었다.
 * - 동의는 필수가 아니다(개인정보 보호법 §22⑤ — 선택 동의 거부를 이유로 서비스 거부 금지). 버튼을 눌러야만 기록된다.
 * - 기록: user_metadata.consent_marketing(버전) + consent_marketing_at(ISO 시각) — 수신 동의 입증용.
 * - 철회는 같은 카드에서 언제든 가능 (정보통신망법 §50 — 수신거부·철회 수단 제공).
 */
export default function MarketingOptInCard({ initialConsented }: { initialConsented: boolean }) {
  const [consented, setConsented] = useState(initialConsented)
  const [justChanged, setJustChanged] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function update(on: boolean) {
    setBusy(true); setError('')
    const now = new Date()
    const { error: err } = await createClient().auth.updateUser({
      data: on
        ? { consent_marketing: CONSENT_VERSION, consent_marketing_at: now.toISOString() }
        : { consent_marketing: null, consent_marketing_off_at: now.toISOString() },
    })
    setBusy(false)
    if (err) { setError('저장하지 못했어요. 잠시 후 다시 시도해 주세요.'); return }
    setConsented(on)
    setJustChanged(`${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`)
  }

  if (consented) {
    return (
      <p role="status" style={{ fontSize: '0.78rem', color: 'var(--gray)', margin: 0, padding: '0 4px', lineHeight: 1.7 }}>
        <span aria-hidden="true" style={{ color: 'var(--navy)' }}>✓</span> 오디션·개강 소식 수신 중
        {justChanged && <> — {justChanged} KD4 액팅 스튜디오의 소식 수신에 동의하셨습니다</>} ·{' '}
        <button type="button" onClick={() => update(false)} disabled={busy} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--navy)', fontWeight: 600, fontSize: 'inherit', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          수신 끄기
        </button>
      </p>
    )
  }

  return (
    <div style={{ padding: '14px 18px', borderRadius: 8, background: 'rgba(21,72,138,0.06)', border: '1px solid rgba(21,72,138,0.3)' }}>
      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)' }}>오디션·캐스팅 기회, 개강 소식 받기 <span style={{ fontWeight: 400, color: 'var(--gray)', fontSize: '0.78rem' }}>(선택)</span></p>
      <p style={{ margin: '5px 0 12px', fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.6 }}>
        놓치기 쉬운 오디션 정보와 새 클래스 개강 소식을 문자·메일로 알려드려요. 언제든 끌 수 있어요.
        {justChanged && <> ({justChanged} 수신을 끄셨습니다)</>}
      </p>
      <button type="button" onClick={() => update(true)} disabled={busy} aria-busy={busy} style={{ padding: '10px 18px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
        {busy ? '저장 중…' : '소식 받기'}
      </button>
      {error && <p role="alert" style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#b91c1c' }}>{error}</p>}
    </div>
  )
}
