import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'

/**
 * 이용약관 v1 (시행 2026-07-07)
 *
 * 핵심 조항: 제6조(프로필 게시물·초상권 이용허락)와 제7조(캐스팅 관계자 의무 —
 * 연락처 캐스팅 목적 외 이용·재배포 금지). 버전 올릴 때 lib/consent.ts CONSENT_VERSION 함께 갱신.
 */

export const metadata: Metadata = {
  title: '이용약관',
  description: 'KD4 액팅 스튜디오(유익액터스) kd4.club 이용약관 — 회원 유형, 배우 프로필 이용허락, 캐스팅 관계자 의무, 수강 신청 안내.',
  alternates: { canonical: `${SITE_URL}/terms` },
}

const H2: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.02rem',
  fontWeight: 700,
  color: 'var(--navy)',
  margin: '34px 0 12px',
  wordBreak: 'keep-all',
}
const P: React.CSSProperties = { fontSize: '0.88rem', color: 'var(--white)', lineHeight: 1.85, marginBottom: 10, wordBreak: 'keep-all' }
const OL: React.CSSProperties = { margin: '0 0 10px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }
const LI: React.CSSProperties = { fontSize: '0.88rem', color: 'var(--white)', lineHeight: 1.8, wordBreak: 'keep-all' }

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 110, paddingBottom: 100 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.3em', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: 10 }}>
          <span lang="en">TERMS OF SERVICE</span>
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>
          이용약관
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 28 }}>
          시행일 2026년 7월 7일 · 버전 v1
        </p>

        <h2 style={H2}>제1조 (목적)</h2>
        <p style={P}>
          이 약관은 유익액터스(KD4 액팅 스튜디오, 이하 &ldquo;KD4&rdquo;)가 운영하는 kd4.club(이하 &ldquo;서비스&rdquo;)의
          이용 조건과 KD4·회원 간의 권리와 의무를 정합니다.
        </p>

        <h2 style={H2}>제2조 (정의)</h2>
        <ol style={OL}>
          <li style={LI}>&ldquo;서비스&rdquo;란 배우 프로필의 등록·공개, 캐스팅 관계자의 열람·연결, 클래스 안내·신청 접수 등 kd4.club에서 제공하는 일체의 기능을 말합니다.</li>
          <li style={LI}>&ldquo;배우 멤버&rdquo;란 본인의 프로필(사진·영상·경력 등)을 등록·공개하는 회원을 말합니다.</li>
          <li style={LI}>&ldquo;캐스팅 관계자 회원&rdquo;(디렉터 회원)이란 캐스팅 디렉터·조감독·제작사 등으로서 KD4의 승인을 받아 배우 프로필과 연락처를 열람하는 회원을 말합니다.</li>
        </ol>

        <h2 style={H2}>제3조 (약관의 효력과 변경)</h2>
        <p style={P}>
          이 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. KD4는 관계 법령을 위반하지 않는 범위에서
          약관을 변경할 수 있으며, 변경 시 적용일 7일 전부터 공지합니다.
        </p>

        <h2 style={H2}>제4조 (회원가입과 유형)</h2>
        <ol style={OL}>
          <li style={LI}>회원가입은 이용자가 약관에 동의하고 가입을 신청하면 KD4가 이를 승낙함으로써 성립합니다.</li>
          <li style={LI}>캐스팅 관계자 회원은 신청 후 KD4의 별도 승인을 거쳐야 하며, KD4는 신원·소속 확인을 위해 추가 자료를 요청할 수 있습니다.</li>
          <li style={LI}>타인의 정보를 도용한 가입은 금지되며, 발견 시 이용이 제한됩니다.</li>
        </ol>

        <h2 style={H2}>제5조 (계정 관리)</h2>
        <p style={P}>
          계정과 비밀번호 관리 책임은 회원에게 있으며, 제3자에게 양도·대여할 수 없습니다.
        </p>

        <h2 style={H2}>제6조 (배우 프로필 게시물과 이용허락)</h2>
        <ol style={OL}>
          <li style={LI}>배우 멤버가 등록한 사진·영상·경력 정보 등(이하 &ldquo;프로필 게시물&rdquo;)의 저작권·초상권은 해당 멤버에게 있습니다.</li>
          <li style={LI}>배우 멤버는 프로필 게시물을 KD4가 <strong>서비스 내 공개 및 캐스팅 연계 목적</strong>(승인된 캐스팅 관계자 제공, 캐스팅 목적의 소개·홍보·배포 포함)으로 이용하는 것을 허락합니다.</li>
          <li style={LI}>배우 멤버는 언제든지 프로필 비공개 전환 또는 게시물 삭제를 요청할 수 있으며, KD4는 지체 없이 반영합니다. 이 경우 이후의 제공·배포는 중단됩니다.</li>
          <li style={LI}>배우 멤버는 본인이 정당한 권리를 가진 자료만 등록해야 하며, 제3자의 저작권·초상권을 침해하는 자료 등록으로 발생하는 문제의 책임은 게시자에게 있습니다.</li>
        </ol>

        <h2 style={H2}>제7조 (캐스팅 관계자 회원의 의무)</h2>
        <ol style={OL}>
          <li style={LI}>캐스팅 관계자 회원은 서비스에서 열람한 배우의 프로필·연락처를 <strong>캐스팅 검토·섭외 연락 목적으로만</strong> 이용해야 합니다.</li>
          <li style={LI}>열람한 정보를 제3자에게 제공·복제·재배포하거나, 영업·광고 등 다른 목적으로 이용하는 것을 금지합니다.</li>
          <li style={LI}>위반 시 KD4는 회원 자격을 제한·상실시킬 수 있으며, 관계 법령에 따른 책임(손해배상 등)을 물을 수 있습니다.</li>
        </ol>

        <h2 style={H2}>제8조 (금지행위)</h2>
        <ol style={OL}>
          <li style={LI}>타인의 계정·정보 도용, 허위 정보 등록</li>
          <li style={LI}>자동화 수단(크롤링 등)을 이용한 정보 무단 수집</li>
          <li style={LI}>서비스의 정상 운영을 방해하는 행위, 법령·공서양속에 반하는 행위</li>
        </ol>

        <h2 style={H2}>제9조 (클래스 수강 신청)</h2>
        <p style={P}>
          서비스의 상담·수강 신청 기능은 접수 창구이며, 수강 계약의 성립·수강료·환불은 관계 법령
          (학원의 설립·운영 및 과외교습에 관한 법률 등)과 신청 시 안내되는 조건에 따릅니다.
        </p>

        <h2 style={H2}>제10조 (서비스의 변경과 중단)</h2>
        <p style={P}>
          KD4는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며,
          중요한 변경은 사전에 공지합니다.
        </p>

        <h2 style={H2}>제11조 (면책)</h2>
        <p style={P}>
          KD4는 천재지변, 통신 장애 등 불가항력으로 인한 서비스 중단, 회원이 등록한 정보의 정확성,
          회원 상호 간 또는 회원과 제3자 간의 캐스팅·계약 결과에 대해서는 고의·중과실이 없는 한 책임을 지지 않습니다.
        </p>

        <h2 style={H2}>제12조 (준거법과 관할)</h2>
        <p style={P}>
          이 약관은 대한민국 법에 따르며, 분쟁이 발생한 경우 민사소송법에 따른 관할 법원에 제소합니다.
        </p>

        <p style={{ ...P, marginTop: 28, color: 'var(--gray)' }}>
          부칙 — 이 약관은 2026년 7월 7일부터 시행합니다. (v1)
        </p>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
          <Link href="/privacy" style={{ fontSize: '0.85rem', color: 'var(--navy)', fontWeight: 600 }}>개인정보처리방침 보기 →</Link>
          <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>홈으로</Link>
        </div>
      </div>
    </div>
  )
}
