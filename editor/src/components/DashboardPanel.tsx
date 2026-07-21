import { useEffect, useMemo, useState } from 'react'
import { Loader2, MousePointerClick, Eye, Users, TrendingUp } from 'lucide-react'
import { useDemoMode } from '../context/DemoModeContext'
import {
  fetchAnalyticsClicks,
  fetchAnalyticsSummary,
  fetchAnalyticsTimeseries,
  formatDeltaPct,
  rangeForDays,
  rangeForPreset,
  truncateUrl,
  type AnalyticsBucket,
  type AnalyticsClickItem,
  type AnalyticsSummary,
  type DateRangePreset,
} from '../lib/analytics'
import {
  demoAnalyticsClicks,
  demoAnalyticsSummary,
  demoAnalyticsTimeseries,
} from '../lib/analyticsDemo'

function MetricCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string
  value: string | number
  delta?: number | null
  hint?: string
}) {
  const deltaLabel = delta !== undefined ? formatDeltaPct(delta) : null
  const positive = (delta ?? 0) > 0
  const negative = (delta ?? 0) < 0

  return (
    <div className="card !p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {deltaLabel && (
        <p
          className={`mt-1 text-xs font-medium ${
            positive ? 'text-emerald-500' : negative ? 'text-red-400' : 'text-muted-foreground'
          }`}
        >
          {deltaLabel}
          <span className="ml-1 font-normal text-muted-foreground">vs período anterior</span>
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function BarChart({
  current,
  previous,
  metric,
  labelFmt,
}: {
  current: AnalyticsBucket[]
  previous?: AnalyticsBucket[]
  metric: 'pageviews' | 'clicks'
  labelFmt?: (bucket: string) => string
}) {
  const max = Math.max(
    1,
    ...current.map((b) => b[metric]),
    ...(previous ?? []).map((b) => b[metric]),
  )

  return (
    <div className="flex h-40 items-end gap-1 sm:gap-1.5">
      {current.map((bucket, index) => {
        const curH = Math.round((bucket[metric] / max) * 100)
        const prevVal = previous?.[index]?.[metric] ?? 0
        const prevH = Math.round((prevVal / max) * 100)
        const label = labelFmt ? labelFmt(bucket.bucket) : bucket.bucket.slice(5)

        return (
          <div key={bucket.bucket} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="relative flex h-28 w-full items-end justify-center gap-0.5">
              {previous && (
                <div
                  className="w-[42%] rounded-t bg-muted-foreground/25"
                  style={{ height: `${prevH}%` }}
                  title={`Anterior: ${prevVal}`}
                />
              )}
              <div
                className="w-[42%] rounded-t bg-primary/80"
                style={{ height: `${Math.max(curH, bucket[metric] > 0 ? 4 : 0)}%` }}
                title={`${bucket.bucket}: ${bucket[metric]}`}
              />
            </div>
            <span className="max-w-full truncate text-[10px] text-muted-foreground">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function LineChart({
  current,
  previous,
  metric,
  labelFmt,
}: {
  current: AnalyticsBucket[]
  previous: AnalyticsBucket[]
  metric: 'pageviews' | 'clicks'
  labelFmt?: (bucket: string) => string
}) {
  const width = 700
  const height = 180
  const padding = { top: 12, right: 12, bottom: 28, left: 34 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const max = Math.max(
    1,
    ...current.map((bucket) => bucket[metric]),
    ...previous.map((bucket) => bucket[metric]),
  )

  type Point = { x: number; y: number }

  function seriesPoints(series: AnalyticsBucket[]): Point[] {
    return series.map((bucket, index) => ({
      x: padding.left + (index / Math.max(1, series.length - 1)) * plotWidth,
      y: padding.top + plotHeight - (bucket[metric] / max) * plotHeight,
    }))
  }

  // Catmull–Rom convertido em curvas Bézier: passa pelos pontos sem criar quinas.
  function smoothPath(points: Point[]): string {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

    const tension = 0.18
    let path = `M ${points[0].x} ${points[0].y}`

    for (let index = 0; index < points.length - 1; index++) {
      const previous = points[Math.max(0, index - 1)]
      const current = points[index]
      const next = points[index + 1]
      const afterNext = points[Math.min(points.length - 1, index + 2)]
      const control1 = {
        x: current.x + (next.x - previous.x) * tension,
        y: current.y + (next.y - previous.y) * tension,
      }
      const control2 = {
        x: next.x - (afterNext.x - current.x) * tension,
        y: next.y - (afterNext.y - current.y) * tension,
      }

      path += ` C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${next.x} ${next.y}`
    }

    return path
  }

  const currentPoints = seriesPoints(current)
  const previousPoints = seriesPoints(previous)
  const currentPath = smoothPath(currentPoints)
  const previousPath = smoothPath(previousPoints)
  const baseline = padding.top + plotHeight
  const areaPath =
    currentPoints.length > 0
      ? `${currentPath} L ${currentPoints.at(-1)!.x} ${baseline} L ${currentPoints[0].x} ${baseline} Z`
      : ''
  const labelStep = Math.max(1, Math.ceil(current.length / 7))
  const gridValues = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="h-48 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Visualizações por dia no período atual e anterior"
      >
        <defs>
          <linearGradient
            id="analytics-line-area"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
            className="text-primary"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.24" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
          <filter id="analytics-line-shadow" x="-10%" y="-20%" width="120%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.16" />
          </filter>
        </defs>

        {gridValues.map((ratio) => {
          const y = padding.top + plotHeight - ratio * plotHeight
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth="1"
              />
              <text
                x={padding.left - 7}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                {Math.round(max * ratio)}
              </text>
            </g>
          )
        })}

        <path
          d={areaPath}
          fill="url(#analytics-line-area)"
          stroke="none"
        />
        <path
          d={previousPath}
          fill="none"
          className="stroke-muted-foreground/55"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 5"
        />
        <path
          d={currentPath}
          fill="none"
          className="stroke-primary"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#analytics-line-shadow)"
        />

        {previousPoints.map((point, index) => (
          <circle
            key={`previous-${previous[index]?.bucket ?? index}`}
            cx={point.x}
            cy={point.y}
            r="2.25"
            className="fill-background stroke-muted-foreground/55"
            strokeWidth="1.5"
          >
            <title>{`Período anterior: ${previous[index]?.[metric] ?? 0} visualizações`}</title>
          </circle>
        ))}

        {current.map((bucket, index) => {
          const { x, y } = currentPoints[index]
          const showLabel =
            index === 0 || index === current.length - 1 || index % labelStep === 0

          return (
            <g key={bucket.bucket}>
              <circle
                cx={x}
                cy={y}
                r="3"
                className="fill-primary stroke-background"
                strokeWidth="1.5"
              >
                <title>{`${bucket.bucket}: ${bucket[metric]} visualizações`}</title>
              </circle>
              {showLabel && (
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {labelFmt ? labelFmt(bucket.bucket) : bucket.bucket}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function formatHourLabel(bucket: string): string {
  return `${bucket}h`
}

function formatDayLabel(bucket: string): string {
  const parts = bucket.split('-')
  if (parts.length !== 3) return bucket
  return `${parts[2]}/${parts[1]}`
}

export function DashboardPanel() {
  const isDemo = useDemoMode()
  const [preset, setPreset] = useState<DateRangePreset>(7)
  const [hourMode, setHourMode] = useState<'period' | 'today'>('period')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [daySeries, setDaySeries] = useState<AnalyticsBucket[]>([])
  const [dayPrevious, setDayPrevious] = useState<AnalyticsBucket[]>([])
  const [hourSeries, setHourSeries] = useState<AnalyticsBucket[]>([])
  const [clicks, setClicks] = useState<AnalyticsClickItem[]>([])

  const range = useMemo(() => rangeForPreset(preset), [preset])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const todayRange = rangeForDays(1)
        const hourFrom = hourMode === 'today' ? todayRange.from : range.from
        const hourTo = hourMode === 'today' ? todayRange.to : range.to

        const [summaryData, dayData, hourData, clicksData] = isDemo
          ? [
              demoAnalyticsSummary(range.from, range.to),
              demoAnalyticsTimeseries(range.from, range.to, 'day'),
              demoAnalyticsTimeseries(hourFrom, hourTo, 'hour'),
              demoAnalyticsClicks(range.from, range.to),
            ]
          : await Promise.all([
              fetchAnalyticsSummary(range.from, range.to),
              fetchAnalyticsTimeseries(range.from, range.to, 'day'),
              fetchAnalyticsTimeseries(hourFrom, hourTo, 'hour'),
              fetchAnalyticsClicks(range.from, range.to, 20),
            ])

        if (cancelled) return
        setSummary(summaryData)
        setDaySeries(dayData.current)
        setDayPrevious(dayData.previous)
        setHourSeries(hourData.current)
        setClicks(clicksData.items)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [range.from, range.to, hourMode, isDemo])

  const ctrLabel =
    summary?.period.ctr != null ? `${Math.round(summary.period.ctr * 1000) / 10}%` : '—'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Visão geral da bio</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([7, 30, 90] as DateRangePreset[]).map((days) => (
            <button
              key={days}
              type="button"
              className={`btn-secondary px-3 py-1.5 text-xs ${
                preset === days ? '!border-primary/40 !bg-primary/10 !text-primary' : ''
              }`}
              onClick={() => setPreset(days)}
            >
              Últimos {days} dias
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card flex items-center gap-2 !p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando métricas…
        </div>
      )}

      {error && !loading && (
        <div className="card !border-red-500/30 !p-4 text-sm text-red-400">{error}</div>
      )}

      {!loading && !error && summary && (
        <>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Inventário
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Visualizações"
                value={summary.period.pageviews}
                delta={summary.delta.pageviews}
              />
              <MetricCard
                label="Acessos únicos"
                value={summary.period.uniques}
                delta={summary.delta.uniques}
              />
              <MetricCard
                label="Cliques"
                value={summary.period.clicks}
                delta={summary.delta.clicks}
              />
              <MetricCard label="Taxa de clique" value={ctrLabel} hint="Cliques / visualizações" />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Situação agora
            </h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="card flex items-start gap-3 !p-3">
                <Eye className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Hoje</p>
                  <p className="text-lg font-semibold tabular-nums">{summary.today.pageviews}</p>
                </div>
              </div>
              <div className="card flex items-start gap-3 !p-3">
                <Users className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Únicos hoje</p>
                  <p className="text-lg font-semibold tabular-nums">{summary.today.uniques}</p>
                </div>
              </div>
              <div className="card flex items-start gap-3 !p-3">
                <MousePointerClick className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Cliques hoje</p>
                  <p className="text-lg font-semibold tabular-nums">{summary.today.clicks}</p>
                </div>
              </div>
              <div className="card flex items-start gap-3 !p-3">
                <TrendingUp className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Mais clicado</p>
                  <p className="text-sm font-semibold leading-snug">
                    {summary.top_click?.label || summary.top_click?.target_url || '—'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="card !p-4">
              <h3 className="mb-1 text-sm font-semibold">Visualizações por dia</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Período atual (cor forte) vs anterior (claro)
              </p>
              <LineChart
                current={daySeries}
                previous={dayPrevious}
                metric="pageviews"
                labelFmt={formatDayLabel}
              />
            </div>

            <div className="card !p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">Horários com mais acessos</h3>
                  <p className="text-xs text-muted-foreground">Visualizações por hora (UTC)</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={`btn-secondary px-2.5 py-1 text-[11px] ${
                      hourMode === 'period' ? '!border-primary/40 !bg-primary/10 !text-primary' : ''
                    }`}
                    onClick={() => setHourMode('period')}
                  >
                    Período
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary px-2.5 py-1 text-[11px] ${
                      hourMode === 'today' ? '!border-primary/40 !bg-primary/10 !text-primary' : ''
                    }`}
                    onClick={() => setHourMode('today')}
                  >
                    Hoje
                  </button>
                </div>
              </div>
              <BarChart current={hourSeries} metric="pageviews" labelFmt={formatHourLabel} />
            </div>
          </section>

          <section className="card !p-4">
            <h3 className="mb-1 text-sm font-semibold">Ranking de cliques</h3>
            <p className="mb-4 text-xs text-muted-foreground">Links e cards com mais cliques no período</p>
            {clicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum clique registrado neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-3 font-semibold">Label</th>
                      <th className="pb-2 pr-3 font-semibold">Tipo</th>
                      <th className="pb-2 pr-3 font-semibold">URL</th>
                      <th className="pb-2 pr-3 font-semibold tabular-nums">Cliques</th>
                      <th className="pb-2 font-semibold tabular-nums">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clicks.map((item, index) => (
                      <tr
                        key={`${item.target_url}-${item.section_id}-${item.item_index}-${index}`}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="py-2.5 pr-3 font-medium">
                          {item.label || 'Sem título'}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{item.item_type || '—'}</td>
                        <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                          {truncateUrl(item.target_url)}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">{item.count}</td>
                        <td className="py-2.5 tabular-nums text-muted-foreground">
                          {Math.round(item.pct * 1000) / 10}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
