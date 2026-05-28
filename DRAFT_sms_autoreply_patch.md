# SMS 신청자 자동회신 패치 초안

작성일: 2026-05-29 새벽 (자율 에이전트 40차)
수정일: 2026-05-29 새벽 (41차 — safeName 스코프 버그 수정)

## 문제
`app/api/notify/route.ts` 294번 줄의 `sendSMS`는 관리자(대표님)에게만 발송.
신청자 본인에게는 자동회신 없음 → Make.com OAuth 만료 시 신청자 아무 연락 못 받음.

## 수정된 해결 코드 (route.ts 299번 줄 — 관리자 블록 닫는 `}` 다음, `// 4. Meta CAPI` 위)

```typescript
    // 3b. 신청자 자동회신 SMS (실패해도 관리자 알림과 DB는 이미 보존됨)
    if (record) {
      const safeApplicantName = name.replace(/[\r\n\t]/g, ' ')
      const safeApplicantPhone = phone.replace(/[\r\n\t]/g, '')
      const applicantMsg = `안녕하세요 ${safeApplicantName}님, KD4 액팅 스튜디오 상담 신청 감사합니다. 빠르게 답변드리겠습니다. - 권동원 대표`
      await sendSMS(safeApplicantPhone, applicantMsg).catch((err) =>
        console.error('[notify] 신청자 자동회신 실패:', err instanceof Error ? err.message : '알 수 없는 오류')
      )
    }
```

⚠️ 이전 드래프트(40차)는 `safeName`을 사용했으나 해당 변수는 관리자 블록(`if (adminPhone && record)`) 안에만 정의됨 → 스코프 오류. 이번 수정본은 `name`을 직접 재sanitize(`safeApplicantName`)하여 해결.

## 삽입 위치 (정확한 위치)
`route.ts` 298번 줄 닫는 `}` 바로 다음:
```
    }  ← 이 줄 (관리자 SMS 블록 끝)

    // 3b. 신청자 자동회신 SMS ← 여기 삽입
    ...

    // 4. Meta CAPI ← 이 줄 위
```

## SMS 문구 (대표님 승인 필요)
> 안녕하세요 {이름}님, KD4 액팅 스튜디오 상담 신청 감사합니다. 빠르게 답변드리겠습니다. - 권동원 대표

문구 변경 원하시면 위 `applicantMsg` 부분만 수정하면 됩니다.

## 효과
- Make.com OAuth 만료에 관계없이 신청자에게 즉시 자동회신
- SOLAPI API Key가 Vercel Production에 이미 세팅되어 있어 즉시 적용 가능
- 실패해도 관리자 알림·DB 저장에는 영향 없음

## 적용 방법
1. 대표님이 SMS 문구 승인
2. 에이전트에게 "SMS 자동회신 패치 적용해줘" 지시
3. 에이전트가 route.ts 수정 + 커밋 + Vercel 자동 배포
