/**
 * Meta(Instagram/Facebook) 광고 인사이트 조회 스크립트
 *
 * 실행:
 *   META_ADS_ACCESS_TOKEN=EAA... npx ts-node \
 *     --project tsconfig.scripts.json scripts/fetch-meta-ads-insights.ts [YYYY-MM-DD]
 *
 * 인자 없으면 "어제" 기준. 인자 있으면 해당 날짜 단일일.
 *
 * 토큰 발급:
 *   1) developers.facebook.com → My Apps → KD4 앱 → Tools → Graph API Explorer
 *   2) Permissions: ads_read, ads_management(선택), business_management
 *   3) "Generate Access Token" → 토큰 복사
 *   4) (선택) developers.facebook.com/tools/debug/accesstoken/ 에서 장기 토큰으로 교환
 *
 * 출력:
 *   - 광고별 노출 / 도달 / 클릭 / CTR / CPC / 지출
 *   - 광고별 일예산 (ad 또는 adset 레벨)
 *   - 4개 광고 일예산 합계
 */

const AD_ACCOUNT_ID = 'act_526088437503063' // ehddnjs1897@gmail.com — KD4
const API_VERSION = 'v21.0'

const TOKEN = process.env.META_ADS_ACCESS_TOKEN
if (!TOKEN) {
  console.error('❌ META_ADS_ACCESS_TOKEN 환경변수가 필요합니다.')
  console.error('   예: META_ADS_ACCESS_TOKEN=EAA... npx ts-node ... scripts/fetch-meta-ads-insights.ts')
  process.exit(1)
}

function yesterdayISO(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

const targetDate = process.argv[2] || yesterdayISO()

type AdInsight = {
  ad_id: string
  ad_name: string
  adset_id: string
  adset_name: string
  campaign_name: string
  impressions?: string
  reach?: string
  clicks?: string
  ctr?: string
  cpc?: string
  spend?: string
  actions?: Array<{ action_type: string; value: string }>
}

type AdBudget = {
  id: string
  name: string
  status: string
  daily_budget?: string // 광고 레벨 일예산 (보통 비어있음)
  adset: {
    id: string
    name: string
    daily_budget?: string // 광고세트 레벨 일예산 (대부분 여기 있음)
    lifetime_budget?: string
    status: string
  }
}

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN! }).toString()
  const url = `https://graph.facebook.com/${API_VERSION}/${path}?${qs}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Graph API ${res.status} on ${path}: ${body}`)
  }
  return res.json() as Promise<T>
}

async function fetchInsights(date: string): Promise<AdInsight[]> {
  const data = await graph<{ data: AdInsight[] }>(`${AD_ACCOUNT_ID}/insights`, {
    level: 'ad',
    fields: 'ad_id,ad_name,adset_id,adset_name,campaign_name,impressions,reach,clicks,ctr,cpc,spend,actions',
    time_range: JSON.stringify({ since: date, until: date }),
    limit: '500',
  })
  return data.data
}

async function fetchAdBudgets(): Promise<AdBudget[]> {
  const data = await graph<{ data: AdBudget[] }>(`${AD_ACCOUNT_ID}/ads`, {
    fields: 'id,name,status,daily_budget,adset{id,name,daily_budget,lifetime_budget,status}',
    effective_status: '["ACTIVE","PAUSED"]',
    limit: '500',
  })
  return data.data
}

function won(microOrString: string | undefined): number {
  // Meta 일예산은 통화 최소단위 (KRW는 원 단위, USD는 cent). KRW 가정.
  if (!microOrString) return 0
  return Number(microOrString)
}

function num(s: string | undefined): number {
  return s ? Number(s) : 0
}

function leadCount(actions: AdInsight['actions']): number {
  if (!actions) return 0
  const leadTypes = new Set(['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'])
  return actions.filter((a) => leadTypes.has(a.action_type)).reduce((s, a) => s + Number(a.value), 0)
}

function fmtKRW(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(n)) + '원'
}

async function main() {
  console.log(`\n📊 Meta 광고 인사이트 — ${targetDate} (KST 기준)`)
  console.log(`   계정: ${AD_ACCOUNT_ID}\n`)

  const [insights, ads] = await Promise.all([fetchInsights(targetDate), fetchAdBudgets()])

  if (insights.length === 0) {
    console.log('⚠️  해당 일자에 노출된 광고가 없습니다 (또는 토큰 권한 부족).')
    return
  }

  // 광고세트 일예산을 한 번만 합산하기 위해 unique adset 기준
  const adsetDailyBudget = new Map<string, { name: string; daily: number }>()
  const adsetById = new Map<string, AdBudget>()
  for (const ad of ads) {
    adsetById.set(ad.id, ad)
    if (ad.adset?.daily_budget) {
      adsetDailyBudget.set(ad.adset.id, {
        name: ad.adset.name,
        daily: won(ad.adset.daily_budget),
      })
    }
  }

  console.log('─── 광고별 어제 성과 ──────────────────────────────────────────')
  for (const r of insights) {
    const adRecord = ads.find((a) => a.id === r.ad_id)
    const dailyBudget =
      won(adRecord?.daily_budget) ||
      won(adRecord?.adset?.daily_budget) ||
      0
    console.log(
      [
        `\n▶ ${r.ad_name}`,
        `   캠페인:    ${r.campaign_name}`,
        `   광고세트:  ${r.adset_name}`,
        `   노출:      ${num(r.impressions).toLocaleString('ko-KR')}`,
        `   도달:      ${num(r.reach).toLocaleString('ko-KR')}`,
        `   클릭:      ${num(r.clicks).toLocaleString('ko-KR')}`,
        `   CTR:       ${num(r.ctr).toFixed(2)}%`,
        `   CPC:       ${fmtKRW(num(r.cpc))}`,
        `   지출:      ${fmtKRW(num(r.spend))}`,
        `   리드(폼):  ${leadCount(r.actions)}`,
        `   일예산:    ${dailyBudget ? fmtKRW(dailyBudget) : '(광고세트 합산 / lifetime budget)'}`,
      ].join('\n')
    )
  }

  console.log('\n─── 일예산 합계 ──────────────────────────────────────────────')
  // 광고 4개에 대한 일예산 = "광고세트 단위로 unique 합산" (Meta는 일예산이 adset 레벨)
  // 단, 단일 광고세트에 여러 광고가 있어도 일예산은 한 번만 카운트
  const usedAdsets = new Set<string>()
  let totalDaily = 0
  for (const r of insights) {
    if (!usedAdsets.has(r.adset_id)) {
      usedAdsets.add(r.adset_id)
      const entry = adsetDailyBudget.get(r.adset_id)
      if (entry) {
        totalDaily += entry.daily
        console.log(`   · ${entry.name}: ${fmtKRW(entry.daily)}`)
      }
    }
  }
  console.log(`\n   광고세트 ${usedAdsets.size}개 일예산 합계: ${fmtKRW(totalDaily)}`)

  // 광고 단위로도 합계 — 광고에 직접 일예산이 박혀있는 경우
  const directAdDaily = insights
    .map((r) => won(ads.find((a) => a.id === r.ad_id)?.daily_budget))
    .reduce((a, b) => a + b, 0)
  if (directAdDaily > 0) {
    console.log(`   광고 단위 일예산 합계(있는 경우만): ${fmtKRW(directAdDaily)}`)
  }

  console.log(`\n   ※ 어제 인사이트 잡힌 광고 수: ${insights.length}개`)

  // 총 지출 / 총 리드도
  const totalSpend = insights.reduce((s, r) => s + num(r.spend), 0)
  const totalLeads = insights.reduce((s, r) => s + leadCount(r.actions), 0)
  const totalClicks = insights.reduce((s, r) => s + num(r.clicks), 0)
  const totalImpr = insights.reduce((s, r) => s + num(r.impressions), 0)
  console.log('\n─── 어제 전체 합계 ───────────────────────────────────────────')
  console.log(`   총 노출:  ${totalImpr.toLocaleString('ko-KR')}`)
  console.log(`   총 클릭:  ${totalClicks.toLocaleString('ko-KR')}`)
  console.log(`   총 지출:  ${fmtKRW(totalSpend)}`)
  console.log(`   총 리드:  ${totalLeads}`)
  if (totalLeads > 0) {
    console.log(`   리드당 단가: ${fmtKRW(totalSpend / totalLeads)}`)
  }
}

main().catch((err) => {
  console.error('❌ 실패:', err.message)
  process.exit(1)
})
