// /join 첫 화면 큰 제목(«어떤 연기 수업을 찾고 계세요?»)은 KoPub 바탕 Bold — 그 글꼴만 미리 받는다.
// 2026-11-19 대표 «2.5초 고»: 예전엔 전체 공통으로 바탕 Medium을 미리 받아 정작 제목 글꼴(Bold)이 늦게 왔다.
export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" href="/fonts/KoPubWorldBatang-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      {children}
    </>
  )
}
