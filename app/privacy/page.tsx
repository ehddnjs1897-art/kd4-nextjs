import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'

/**
 * 개인정보처리방침 v1 (시행 2026-07-07)
 *
 * - 배우 프로필(사진·영상·신체정보·연락처)을 수집해 캐스팅 관계자에게 제공하는
 *   서비스 특성상 "제3자 제공" 조항이 핵심 — 개인정보보호법 제30조 공개 의무 이행.
 * - 동의 기록은 Supabase Auth user_metadata(consent_tos/consent_privacy/consent_dist)로 남김.
 * - 버전 올릴 때: CONSENT_VERSION(lib/consent.ts)과 이 문서의 시행일을 함께 갱신할 것.
 */

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'KD4 액팅 스튜디오(유익액터스) 개인정보처리방침 — 수집 항목, 이용 목적, 캐스팅 관계자 제공, 보유 기간, 정보주체 권리 안내.',
  alternates: { canonical: `${SITE_URL}/privacy` },
}

const H2: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.05rem',
  fontWeight: 700,
  color: 'var(--navy)',
  margin: '36px 0 12px',
  wordBreak: 'keep-all',
}
const P: React.CSSProperties = { fontSize: '0.88rem', color: 'var(--white)', lineHeight: 1.85, marginBottom: 10, wordBreak: 'keep-all' }
const UL: React.CSSProperties = { margin: '0 0 10px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }
const LI: React.CSSProperties = { fontSize: '0.88rem', color: 'var(--white)', lineHeight: 1.8, wordBreak: 'keep-all' }
const TH: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: '0.78rem', color: 'var(--navy)', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--white)', borderBottom: '1px solid var(--border)', lineHeight: 1.7, verticalAlign: 'top', wordBreak: 'keep-all' }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 110, paddingBottom: 100 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.3em', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: 10 }}>
          <span lang="en">PRIVACY POLICY</span>
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>
          개인정보처리방침
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 28 }}>
          시행일 2026년 7월 7일 · 버전 v1
        </p>

        <p style={P}>
          유익액터스(KD4 액팅 스튜디오, 이하 &ldquo;KD4&rdquo;)는 kd4.club(이하 &ldquo;서비스&rdquo;)을 운영하며
          개인정보보호법 등 관계 법령을 준수합니다. 이 방침은 KD4가 어떤 개인정보를 왜 수집하고,
          누구에게 제공하며, 어떻게 보호하는지를 알려드립니다.
        </p>

        <h2 style={H2}>1. 수집하는 개인정보</h2>
        <ul style={UL}>
          <li style={LI}><strong>회원가입</strong> — 이름, 이메일, 비밀번호, 전화번호(배우 회원), 성별(배우 회원), 소속(디렉터 회원, 선택)</li>
          <li style={LI}><strong>배우 프로필</strong> — 출생연도, 키·몸무게, 학력(학교·전공), 특기·사투리, 프로필 사진·현재 사진·연기 영상, 출연 경력(필모그래피), 수상 이력, 인스타그램 계정, 프로필 문서(이력서)</li>
          <li style={LI}><strong>상담·수강 신청</strong> — 이름, 연락처, 이메일, 희망 클래스, 유입 경로</li>
          <li style={LI}><strong>자동 수집</strong> — 접속 기록, 쿠키, 서비스 이용 기록 (Google Analytics·Meta Pixel 등 방문 통계·광고 성과 도구)</li>
        </ul>

        <h2 style={H2}>2. 이용 목적</h2>
        <ul style={UL}>
          <li style={LI}>배우 프로필 페이지 제작·서비스 내 공개 및 캐스팅 연계(오디션·작품 매칭, 캐스팅 관계자 열람 제공)</li>
          <li style={LI}>회원 관리(본인 확인, 권한 구분), 클래스 상담·수강 운영, 공지·안내 문자 발송</li>
          <li style={LI}>서비스 개선을 위한 통계 분석, 광고 성과 측정</li>
        </ul>

        <h2 style={H2}>3. 개인정보의 제3자 제공</h2>
        <p style={P}>
          KD4의 핵심 서비스는 배우 멤버의 프로필을 캐스팅 기회와 연결하는 것입니다.
          이를 위해 <strong>본인의 동의를 받은 배우 멤버에 한해</strong> 아래와 같이 제공합니다.
        </p>
        <div style={{ overflowX: 'auto', marginBottom: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border)', minWidth: 520 }}>
            <thead>
              <tr>
                <th style={TH}>받는 자</th>
                <th style={TH}>제공 항목</th>
                <th style={TH}>제공 목적</th>
                <th style={TH}>보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={TD}>KD4가 승인한 캐스팅 관계자 회원<br />(캐스팅 디렉터·조감독·제작사 등)</td>
                <td style={TD}>이름, 프로필(사진·영상·경력·신체정보 등 공개 프로필 일체), 연락처(전화·이메일·인스타그램)</td>
                <td style={TD}>캐스팅 검토 및 섭외 연락</td>
                <td style={TD}>제공 목적 달성 시까지<br />(동의 철회·프로필 비공개 전환 시 제공 중단)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={P}>
          연락처는 서비스 화면에서 <strong>승인된 캐스팅 관계자 회원에게만</strong> 표시되며, 일반 방문자에게는 공개되지 않습니다.
          동의하지 않을 권리가 있으며, 동의하지 않는 경우 프로필 공개·캐스팅 연계 서비스 이용이 제한될 수 있습니다.
        </p>

        <h2 style={H2}>4. 처리 위탁 및 국외 이전</h2>
        <ul style={UL}>
          <li style={LI}>Supabase — 회원·프로필 데이터 및 파일(사진·영상·문서) 보관 (서버가 국외에 소재할 수 있음)</li>
          <li style={LI}>Vercel — 웹사이트 호스팅 (서버가 국외에 소재할 수 있음)</li>
          <li style={LI}>Solapi — 문자(SMS/LMS/MMS) 발송</li>
          <li style={LI}>Google(Analytics)·Meta(Pixel) — 방문 통계 및 광고 성과 측정</li>
        </ul>

        <h2 style={H2}>5. 보유 및 이용 기간</h2>
        <p style={P}>
          회원 탈퇴 또는 동의 철회 시 지체 없이 파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우
          (예: 전자상거래 등에서의 소비자 보호에 관한 법률에 따른 계약·대금결제 기록 5년, 소비자 불만·분쟁처리 기록 3년)
          해당 기간 동안 분리 보관 후 파기합니다.
        </p>

        <h2 style={H2}>6. 파기 절차 및 방법</h2>
        <p style={P}>
          전자 파일은 복구할 수 없는 방법으로 삭제하고, 출력물은 분쇄 또는 소각합니다.
        </p>

        <h2 style={H2}>7. 정보주체의 권리</h2>
        <ul style={UL}>
          <li style={LI}>언제든지 본인 개인정보의 열람·정정·삭제·처리정지, 동의 철회를 요청할 수 있습니다.</li>
          <li style={LI}>배우 멤버는 <strong>프로필 비공개 전환</strong>(공개·제공 중단)을 요청할 수 있으며, 요청 시 지체 없이 반영합니다.</li>
          <li style={LI}>요청 방법 — 마이페이지에서 직접 수정, 또는 아래 연락처로 요청</li>
        </ul>

        <h2 style={H2}>8. 만 14세 미만 아동</h2>
        <p style={P}>
          서비스는 원칙적으로 만 14세 이상을 대상으로 하며, 만 14세 미만 아동은 법정대리인의 동의가 있어야
          이용할 수 있습니다. 법정대리인 동의가 확인되지 않으면 가입 및 프로필 공개가 제한됩니다.
        </p>

        <h2 style={H2}>9. 쿠키 및 행태정보</h2>
        <p style={P}>
          서비스 개선과 광고 성과 측정을 위해 쿠키(Google Analytics, Meta Pixel)를 사용합니다.
          브라우저 설정에서 쿠키 저장을 거부할 수 있으며, 이 경우 일부 기능 이용에 제한이 있을 수 있습니다.
        </p>

        <h2 style={H2}>10. 안전성 확보 조치</h2>
        <ul style={UL}>
          <li style={LI}>연락처 등 민감한 항목은 열람 권한을 승인된 캐스팅 관계자 회원·관리자로 제한</li>
          <li style={LI}>접근 권한 관리, 전송 구간 암호화(HTTPS), 접속 기록 보관</li>
        </ul>

        <h2 style={H2}>11. 개인정보 보호책임자</h2>
        <ul style={UL}>
          <li style={LI}>책임자 — 권동원 (대표)</li>
          <li style={LI}>연락처 — 010-8564-0244 · <a href="https://pf.kakao.com/_ximxdqn" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', fontWeight: 600 }}>카카오 채널 문의</a></li>
        </ul>

        <h2 style={H2}>12. 고지 의무</h2>
        <p style={P}>
          이 방침의 내용이 추가·변경될 경우 시행 7일 전부터 서비스 공지사항을 통해 알립니다.
        </p>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
          <Link href="/terms" style={{ fontSize: '0.85rem', color: 'var(--navy)', fontWeight: 600 }}>이용약관 보기 →</Link>
          <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>홈으로</Link>
        </div>
      </div>
    </div>
  )
}
