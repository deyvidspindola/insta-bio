import { useEffect, useMemo, useState } from 'react'
import { Loader2, MousePointerClick, Eye, TrendingUp, Users, ChevronDown } from 'lucide-react'
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
import { AnalyticsBarChart, AnalyticsLineChart } from './analyticsCharts'

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 7, label: 'Últimos 7 dias' },
  { value: 30, label: 'Últimos 30 dias' },
  { value: 90, label: 'Últimos 90 dias' },
]

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
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {deltaLabel && (
        <p
          className={`mt-1 text-xs font-medium ${
            positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-foreground/55'
          }`}
        >
          {deltaLabel}
          <span className="ml-1 font-normal text-foreground/50">vs período anterior</span>
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>}
    </div>
  )
}

function formatHourLabel(bucket: string): string {
  const hour = Number.parseInt(bucket, 10)
  if (Number.isNaN(hour)) return `${bucket}h`
  return `${hour}h`
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
    <div className="space-y-5 pb-24 md:pb-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Visão geral da bio</p>
        </div>

        {/* Mobile: dropdown (div — label global força display:block e quebra sm:hidden) */}
        <div className="relative shrink-0 md:hidden">
          <span className="sr-only">Período</span>
          <select
            className="!w-auto appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-xs font-medium text-foreground"
            value={preset}
            onChange={(event) => setPreset(Number(event.target.value) as DateRangePreset)}
            aria-label="Período"
          >
            {PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>

        {/* Desktop: botões */}
        <div className="hidden flex-wrap justify-end gap-1.5 md:flex">
          {PRESET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`btn-secondary px-3 py-1.5 text-xs ${
                preset === option.value ? '!border-primary/40 !bg-primary/10 !text-primary' : ''
              }`}
              onClick={() => setPreset(option.value)}
            >
              {option.label}
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
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Inventário
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Visualizações"
                value={summary.period.pageviews}
                delta={summary.delta.pageviews}
              />
              <MetricCard
                label="Usuários únicos"
                value={summary.period.uniques}
                delta={summary.delta.uniques}
                hint="Visitantes distintos no período"
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
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Situação agora
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="card flex items-start gap-3 !p-3">
                <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/55">Visualizações hoje</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{summary.today.pageviews}</p>
                </div>
              </div>
              <div className="card flex items-start gap-3 !p-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/55">Únicos hoje</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{summary.today.uniques}</p>
                </div>
              </div>
              <div className="card flex items-start gap-3 !p-3">
                <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/55">Cliques hoje</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{summary.today.clicks}</p>
                </div>
              </div>
              <div className="card flex items-start gap-3 !p-3">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[11px] text-foreground/55">Mais clicado</p>
                  <p className="truncate text-sm font-semibold leading-snug text-foreground">
                    {summary.top_click?.label || summary.top_click?.target_url || '—'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="card !p-3 sm:!p-4">
              <h3 className="mb-1 text-sm font-semibold text-foreground">Visualizações por dia</h3>
              <p className="mb-3 text-xs text-foreground/55 sm:mb-4">
                Período atual (cor forte) vs anterior (claro)
              </p>
              <AnalyticsLineChart
                current={daySeries}
                previous={dayPrevious}
                metric="pageviews"
                labelFmt={formatDayLabel}
              />
            </div>

            <div className="card !p-3 sm:!p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">Horários com mais acessos</h3>
                  <p className="text-xs text-foreground/55">
                    Visualizações por hora (horário de Brasília)
                  </p>
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
              <AnalyticsBarChart current={hourSeries} metric="pageviews" labelFmt={formatHourLabel} />
            </div>
          </section>

          <section className="card !p-3 sm:!p-4">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Ranking de cliques</h3>
            <p className="mb-4 text-xs text-foreground/55">
              Links e cards com mais cliques no período
            </p>
            {clicks.length === 0 ? (
              <p className="text-sm text-foreground/55">Nenhum clique registrado neste período.</p>
            ) : (
              <>
                {/* Mobile: lista compacta */}
                <ul className="space-y-2 sm:hidden">
                  {clicks.map((item, index) => (
                    <li
                      key={`${item.target_url}-${item.section_id}-${item.item_index}-${index}`}
                      className="rounded-lg border border-border/70 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.label || 'Sem título'}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-foreground/50">
                            {item.item_type || '—'} · {truncateUrl(item.target_url)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">{item.count}</p>
                          <p className="text-[11px] tabular-nums text-foreground/50">
                            {Math.round(item.pct * 1000) / 10}%
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Desktop: tabela */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] uppercase tracking-wide text-foreground/55">
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
                          <td className="py-2.5 pr-3 font-medium text-foreground">
                            {item.label || 'Sem título'}
                          </td>
                          <td className="py-2.5 pr-3 text-foreground/60">
                            {item.item_type || '—'}
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-foreground/55">
                            {truncateUrl(item.target_url)}
                          </td>
                          <td className="py-2.5 pr-3 tabular-nums text-foreground">{item.count}</td>
                          <td className="py-2.5 tabular-nums text-foreground/60">
                            {Math.round(item.pct * 1000) / 10}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
