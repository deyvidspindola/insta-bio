import type {
  AnalyticsClicks,
  AnalyticsSummary,
  AnalyticsTimeseries,
} from './analytics'

function seed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

function daysBetween(from: string, to: string): string[] {
  const out: string[] = []
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function dayBucket(day: string) {
  const pageviews = Math.floor(seed(`pv-${day}`) * 60) + 5
  const clicks = Math.floor(seed(`cl-${day}`) * pageviews * 0.4)
  const uniques = Math.max(1, Math.floor(pageviews * (0.6 + seed(`un-${day}`) * 0.3)))
  return { pageviews, clicks, uniques }
}

function periodStats(from: string, to: string) {
  let pageviews = 0
  let clicks = 0
  let uniques = 0
  for (const day of daysBetween(from, to)) {
    const b = dayBucket(day)
    pageviews += b.pageviews
    clicks += b.clicks
    uniques += b.uniques
  }
  const ctr = pageviews > 0 ? Math.round((clicks / pageviews) * 10000) / 10000 : null
  return { pageviews, uniques, clicks, ctr }
}

function shiftRange(from: string, to: string) {
  const days = daysBetween(from, to).length
  const prevTo = new Date(`${from}T00:00:00Z`)
  prevTo.setUTCDate(prevTo.getUTCDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (days - 1))
  return {
    from: prevFrom.toISOString().slice(0, 10),
    to: prevTo.toISOString().slice(0, 10),
  }
}

function delta(cur: number, prev: number): number {
  if (prev === 0) return cur > 0 ? 1 : 0
  return Math.round(((cur - prev) / prev) * 10000) / 10000
}

const DEMO_CLICKS = [
  {
    section_id: 'links',
    item_index: 0,
    item_type: 'link',
    label: 'WhatsApp',
    target_url: 'https://wa.me/5511999999999',
  },
  {
    section_id: 'links',
    item_index: 1,
    item_type: 'link',
    label: 'Loja online',
    target_url: 'https://loja.exemplo.com',
  },
  {
    section_id: 'redes',
    item_index: 0,
    item_type: 'feature',
    label: 'Instagram',
    target_url: 'https://instagram.com/exemplo',
  },
  {
    section_id: 'links',
    item_index: 2,
    item_type: 'link',
    label: 'Catálogo PDF',
    target_url: 'https://exemplo.com/catalogo.pdf',
  },
  {
    section_id: 'contato',
    item_index: 0,
    item_type: 'location',
    label: 'Como chegar',
    target_url: 'https://maps.google.com/?q=exemplo',
  },
] as const

/** Dados de exemplo para demo pública e fallback local sem API. */
export function demoAnalyticsSummary(from: string, to: string): AnalyticsSummary {
  const prev = shiftRange(from, to)
  const period = periodStats(from, to)
  const previous = periodStats(prev.from, prev.to)
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayBucket = dayBucket(todayStr)
  const top = DEMO_CLICKS[0]

  return {
    ok: true,
    from,
    to,
    period,
    previous,
    delta: {
      pageviews: delta(period.pageviews, previous.pageviews),
      uniques: delta(period.uniques, previous.uniques),
      clicks: delta(period.clicks, previous.clicks),
    },
    today: {
      pageviews: todayBucket.pageviews,
      uniques: todayBucket.uniques,
      clicks: todayBucket.clicks,
      ctr: todayBucket.pageviews > 0 ? todayBucket.clicks / todayBucket.pageviews : null,
    },
    top_click: {
      label: top.label,
      item_type: top.item_type,
      target_url: top.target_url,
      count: Math.max(1, Math.floor(period.clicks * 0.3)),
    },
  }
}

export function demoAnalyticsTimeseries(
  from: string,
  to: string,
  grain: 'day' | 'hour',
): AnalyticsTimeseries {
  const prev = shiftRange(from, to)

  if (grain === 'hour') {
    const build = (label: string) =>
      Array.from({ length: 24 }, (_, h) => {
        const key = String(h).padStart(2, '0')
        const peak = h >= 8 && h <= 22 ? 1 : 0.2
        const pv = Math.floor(seed(`${label}-h-${key}`) * 30 * peak)
        return { bucket: key, pageviews: pv, clicks: Math.floor(pv * 0.35) }
      })
    return { ok: true, from, to, grain, current: build(from), previous: build(prev.from) }
  }

  return {
    ok: true,
    from,
    to,
    grain: 'day',
    current: daysBetween(from, to).map((day) => {
      const b = dayBucket(day)
      return { bucket: day, pageviews: b.pageviews, clicks: b.clicks }
    }),
    previous: daysBetween(prev.from, prev.to).map((day) => {
      const b = dayBucket(day)
      return { bucket: day, pageviews: b.pageviews, clicks: b.clicks }
    }),
  }
}

export function demoAnalyticsClicks(from: string, to: string): AnalyticsClicks {
  const period = periodStats(from, to)
  const weights = [0.34, 0.24, 0.18, 0.14, 0.1]
  const items = DEMO_CLICKS.map((click, index) => {
    const count = Math.max(0, Math.floor(period.clicks * weights[index]!))
    return {
      ...click,
      count,
      pct: period.clicks > 0 ? count / period.clicks : 0,
    }
  }).filter((item) => item.count > 0)

  return { ok: true, from, to, items }
}
