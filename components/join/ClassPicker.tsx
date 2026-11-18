'use client'

import { ArrowRight, MessageCircle } from 'lucide-react'
import type { InstantClass } from '@/lib/join-instant'
import { openConsult } from '@/lib/consult-instant'
import JoinCTALink from './JoinCTALink'
import s from './ClassPicker.module.css'

/**
 * /join 클래스 선택 화면 (2026-11-18 대표 브리프 — 리바이저 문의 페이지 방식)
 * 큰 질문 하나 + 눈에 잘 들어오는 선택지. 타일을 누르면 「다음」 없이 그 클래스 상담창이 바로 열린다.
 *
 * - 휴대폰 2열 / PC 3열, 글자 타일 6개. 수업 사진은 넣지 않는다 (2026-11-19 대표: «클래스 소개에 어차피 있으니까»).
 * - 가격은 여기서 보여주지 않는다 — 누른 직후·연락처 입력 전에 상담창에서 보여준다.
 * - 타일은 링크(<a>)다: 화면이 덜 켜진 순간에 눌려도 그 클래스 소개 페이지로 가므로 «눌러도 반응 없는» 일이 없다.
 */
export default function ClassPicker({
  classes,
  id,
  location,
  variant = 'top',
}: {
  classes: InstantClass[]
  /** 구역 id — 기존 버튼들이 가리키는 #form-hero / #form 을 그대로 쓴다 */
  id: string
  /** 전환 측정용 위치 이름 */
  location: string
  variant?: 'top' | 'bottom'
}) {
  const isTop = variant === 'top'
  const Heading = isTop ? 'h1' : 'h2'

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, c: InstantClass) {
    // 새 탭으로 열기(⌘·Ctrl·Shift·가운데 버튼)는 막지 않는다
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    openConsult(c.key, location)
  }

  return (
    <section id={id} aria-label="클래스 선택" className={`${s.wrap} ${isTop ? s.top : s.bottom}`}>
      <div className={s.inner}>
        {isTop && <p className={s.eyebrow}>신촌 · KD4 액팅 스튜디오</p>}
        <Heading className={s.question}>
          어떤 연기 수업을 <span className={s.nowrap}>찾고 계세요?</span>
        </Heading>
        <p className={s.lead}>
          클래스를 누르면 <span className={s.nowrap}>수강료와 상담 신청이 바로 열려요.</span>
        </p>

        <ul className={s.grid} role="list">
          {classes.map((c) => (
            <li key={c.key}>
              <a
                href={c.href}
                className={`${s.tile} ${c.key === 'recommend' ? s.tileRecommend : ''}`}
                aria-haspopup="dialog"
                onClick={(e) => handleClick(e, c)}
              >
                <span className={s.name}>
                  {c.label}
                  <ArrowRight aria-hidden={true} size={15} strokeWidth={2.2} className={s.arrow} />
                </span>
                <span className={s.sub}>{c.sub}</span>
              </a>
            </li>
          ))}
        </ul>

        {isTop ? (
          <>
            {/* 첫 화면에 있던 세 숫자(대표 확정값)를 한 줄로 */}
            <p className={s.trust}>
              <span>현직 배우 150명 수료</span>
              <span>캐스팅 연계 3년 운영</span>
              <span>정원 6~8명 소수정예</span>
            </p>
            <p className={s.alt}>
              연기 경험 없어도 OK ·{' '}
              <JoinCTALink
                href="https://pf.kakao.com/_ximxdqn"
                kind="external"
                channel="kakao"
                location="hero"
                label="카카오로 문의하기"
                fireLead
                aria-label="카카오로 문의하기 (새 탭에서 열림)"
                className={s.altLink}
              >
                <MessageCircle aria-hidden={true} size={13} strokeWidth={2.2} />
                카카오로 문의하기
              </JoinCTALink>
            </p>
          </>
        ) : (
          <p className={s.alt}>상담은 무료예요. 접수하면 바로 안내 문자를 보내고, 1~2일 안에 대표가 직접 전화드립니다.</p>
        )}
      </div>
    </section>
  )
}
