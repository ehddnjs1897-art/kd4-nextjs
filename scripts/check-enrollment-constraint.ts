/**
 * enrollment_type CHECK 제약 라이브 실측 (2026-06-18)
 * 추측 금지 — service_role로 실제 INSERT를 시도해 어떤 값이 허용/거부되는지 확인.
 * 더미 row는 즉시 삭제(부작용 0). 명령줄 키 하드코딩 금지 → process.env로만.
 */
import './_loadEnv'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.log('NO_ENV'); process.exit(1) }

const admin = createClient(url, key, { auth: { persistSession: false } })
const DUMMY_YM = '2099-12'

async function main() {
  // FK 충족용 계정 1개
  const { data: prof, error: pErr } = await admin.from('profiles').select('id').limit(1).maybeSingle()
  if (pErr || !prof) { console.log('NO_PROFILE', pErr?.message ?? ''); return }
  const uid = prof.id

  // 현재 실제 들어있는 값 분포
  const { data: types } = await admin.from('enrollments').select('enrollment_type')
  const counts: Record<string, number> = {}
  for (const t of types ?? []) counts[t.enrollment_type] = (counts[t.enrollment_type] ?? 0) + 1
  console.log('CURRENT_DISTRIBUTION:', JSON.stringify(counts))

  // 코드가 보내는 4개 값 각각 INSERT 테스트
  const CODE_TYPES = ['신규 등록', '수업 유지', '클래스 추가·변경', '퍼스널 브랜딩 서비스']
  for (const t of CODE_TYPES) {
    const cn = `__constraint_test_${t}__`
    const { error } = await admin.from('enrollments').insert({
      user_id: uid, enrollment_type: t, year_month: DUMMY_YM,
      class_name: cn, amount: 0, status: '확정', payment_status: '결제대기',
    }).select('id')
    if (error) {
      console.log(`REJECT  ${t}  → ${error.code} ${error.message}`)
    } else {
      console.log(`ALLOW   ${t}`)
    }
  }

  // 더미 정리 (안전망: DUMMY_YM 전부 삭제)
  const { error: delErr, count } = await admin
    .from('enrollments').delete({ count: 'exact' }).eq('year_month', DUMMY_YM)
  console.log('CLEANUP:', delErr ? `FAIL ${delErr.message}` : `삭제 ${count ?? '?'}건`)
}

main().catch((e) => console.error('FATAL', e instanceof Error ? e.message : String(e)))
