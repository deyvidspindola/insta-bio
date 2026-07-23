import { ENDPOINTS } from './endpoints'

export type AnalyticsPeriod = {
  pageviews: number
  uniques: number
  clicks: number
  ctr: number | null
}

export type AnalyticsSummary = {
  ok: true
  from: string
  to: string
  period: AnalyticsPeriod
  previous: AnalyticsPeriod
  delta: {
    pageviews: number | null
    uniques: number | null
    clicks: number | null
  }
  today: AnalyticsPeriod
  top_click: {
    label: string | null
    item_type: string | null
    target_url: string | null
    count: number
  } | null
}

export type AnalyticsBucket = {
  bucket: string
  pageviews: number
  clicks: number
}

export type AnalyticsTimeseries = {
  ok: true
  from: string
  to: string
  grain: 'day' | 'hour'
  current: AnalyticsBucket[]
  previous: AnalyticsBucket[]
}

export type AnalyticsClickItem = {
  section_id: string | null
  item_index: number | null
  item_type: string | null
  label: string | null
  target_url: string | null
  count: number
  pct: number
}

export type AnalyticsClicks = {
  ok: true
  from: string
  to: string
  items: AnalyticsClickItem[]
}

export type DateRangePreset = 7 | 30 | 90

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function rangeForDays(days: number): { from: string; to: string } {
  const safeDays = Math.max(1, Math.min(366, Math.floor(days)))
  const to = new Date()
  // Datas locais (o backend interpreta from/to no fuso de exibição).
  const from = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  from.setDate(from.getDate() - (safeDays - 1))
  return { from: toYmd(from), to: toYmd(to) }
}

export function rangeForPreset(days: DateRangePreset): { from: string; to: string } {
  return rangeForDays(days)
}

async function fetchAnalytics<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  }
  const url = `${endpoint}?${qs.toString()}`
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
  if (!res.ok || !data || data.ok !== true) {
    throw new Error(data?.error || 'Não foi possível carregar analytics')
  }
  return data as T
}

export function fetchAnalyticsSummary(from: string, to: string) {
  return fetchAnalytics<AnalyticsSummary>(ENDPOINTS.analyticsSummary, { from, to })
}

export function fetchAnalyticsTimeseries(
  from: string,
  to: string,
  grain: 'day' | 'hour' = 'day',
) {
  return fetchAnalytics<AnalyticsTimeseries>(ENDPOINTS.analyticsTimeseries, { from, to, grain })
}

export function fetchAnalyticsClicks(from: string, to: string, limit = 20) {
  return fetchAnalytics<AnalyticsClicks>(ENDPOINTS.analyticsClicks, { from, to, limit })
}

export function formatDeltaPct(delta: number | null | undefined): string {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return '—'
  const pct = Math.round(delta * 100)
  if (pct > 0) return `+${pct}%`
  if (pct < 0) return `${pct}%`
  return '0%'
}

export function truncateUrl(url: string | null | undefined, max = 42): string {
  if (!url) return '—'
  if (url.length <= max) return url
  return `${url.slice(0, max - 1)}…`
}
