import Image from 'next/image'
import Link from 'next/link'
import JoinCTALink from './JoinCTALink'
import styles from './JoinHeader.module.css'

/**
 * /join 전용 얇은 상단 메뉴 (2026-11-14, 대표 확정 ②안)
 * 로고 + 클래스·수강료 / 후기 / 오시는 길 + 무료상담.
 * 검색 광고 유입자는 신청 전에 수강료·후기·위치를 확인하려 하는데 /join에는 나갈 길이 없었다.
 * 광고 꼬리표(UTM)는 sessionStorage에 남아 다른 페이지를 다녀와도 유지된다.
 */
export default function JoinHeader() {
  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.logo} aria-label="KD4 액팅 스튜디오 홈">
        <Image
          src="/heart-logo.png"
          alt="KD4 Acting Studio"
          width={400}
          height={400}
          sizes="40px"
          priority
          style={{
            height: '36px',
            width: 'auto',
            objectFit: 'contain',
            background: '#D5D0C8',
            borderRadius: '6px',
            padding: '3px 7px',
          }}
        />
      </Link>
      <nav className={styles.nav} aria-label="주요 안내">
        <JoinCTALink href="/classes" location="join_nav" label="클래스·수강료" fireLead className={styles.link}>
          클래스·수강료
        </JoinCTALink>
        <JoinCTALink href="/reviews" location="join_nav" label="후기" fireLead className={styles.link}>
          후기
        </JoinCTALink>
        <JoinCTALink
          href="/sinchon-acting-academy"
          location="join_nav"
          label="오시는 길"
          fireLead
          className={`${styles.link} ${styles.hideNarrow}`}
        >
          오시는 길
        </JoinCTALink>
      </nav>
      <JoinCTALink href="#form-hero" location="join_nav" label="무료상담" fireLead className={styles.cta}>
        무료상담
      </JoinCTALink>
    </header>
  )
}
