import { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import type { AnalyticsBucket } from '../lib/analytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
)

type Metric = 'pageviews' | 'clicks'

/** Canvas só aceita cores resolvidas (rgb/hex); oklch/color-mix quebram e viram preto. */
function resolveCanvasColor(cssValue: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  try {
    const probe = document.createElement('span')
    probe.style.cssText = `color:${cssValue};position:absolute;visibility:hidden;pointer-events:none`
    document.documentElement.appendChild(probe)
    const computed = getComputedStyle(probe).color
    probe.remove()

    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return fallback
    ctx.fillStyle = '#ffffff'
    ctx.fillStyle = computed || fallback
    const resolved = String(ctx.fillStyle || '')
    // Se oklch falhou, fillStyle fica preto — trata como inválido
    const normalized = resolved.replace(/\s+/g, '').toLowerCase()
    if (
      !resolved ||
      normalized === '#000000' ||
      normalized === '#000' ||
      normalized === 'rgb(0,0,0)' ||
      normalized === 'rgba(0,0,0,1)'
    ) {
      return fallback
    }
    return resolved
  } catch {
    return fallback
  }
}

function readThemeColor(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return resolveCanvasColor(raw || fallback, fallback)
}

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`
  }
  // hex #rrggbb
  const hex = color.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = Number.parseInt(hex[1], 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return color
}

function useChartTheme() {
  const [themeKey, setThemeKey] = useState(
    () =>
      (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) ||
      'dark',
  )

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setThemeKey(root.getAttribute('data-theme') || 'dark')
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return useMemo(() => {
    const primary = readThemeColor('--color-primary', '#e8a317')
    const mutedFg = readThemeColor('--color-muted-foreground', '#b8c0cc')
    const border = readThemeColor('--color-border', '#3a4150')
    const card = readThemeColor('--color-card', '#1c2230')
    const foreground = readThemeColor('--color-foreground', '#f4f6fa')
    // Eixos/legendas: mais claros que muted puro (oklch no canvas já falhava → preto)
    const tick = withAlpha(foreground, 0.72)

    return {
      primary,
      mutedFg,
      tick,
      border,
      card,
      foreground,
      previous: withAlpha(mutedFg, 0.65),
      areaTop: withAlpha(primary, 0.28),
      areaBottom: withAlpha(primary, 0.02),
      grid: withAlpha(border, 0.85),
    }
  }, [themeKey])
}

function baseOptions(theme: ReturnType<typeof useChartTheme>): ChartOptions<'line' | 'bar'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          color: theme.tick,
          font: { size: 11 },
        },
      },
      tooltip: {
        enabled: true,
        displayColors: true,
        backgroundColor: theme.card,
        titleColor: theme.foreground,
        bodyColor: theme.foreground,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 10,
        titleFont: { size: 12, weight: 600 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: theme.tick,
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grace: '8%',
        grid: {
          color: theme.grid,
        },
        ticks: {
          color: theme.tick,
          font: { size: 11 },
          precision: 0,
          maxTicksLimit: 5,
        },
        border: { display: false },
      },
    },
  }
}

export function AnalyticsLineChart({
  current,
  previous,
  metric,
  labelFmt,
}: {
  current: AnalyticsBucket[]
  previous: AnalyticsBucket[]
  metric: Metric
  labelFmt?: (bucket: string) => string
}) {
  const theme = useChartTheme()

  const data = useMemo(() => {
    const labels = current.map((bucket) =>
      labelFmt ? labelFmt(bucket.bucket) : bucket.bucket,
    )
    return {
      labels,
      datasets: [
        {
          label: 'Período anterior',
          data: previous.map((bucket) => bucket[metric]),
          borderColor: theme.previous,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.35,
        },
        {
          label: 'Período atual',
          data: current.map((bucket) => bucket[metric]),
          borderColor: theme.primary,
          backgroundColor: (ctx: ScriptableContext<'line'>) => {
            const chart = ctx.chart
            const { ctx: c, chartArea } = chart
            if (!chartArea) return theme.areaTop
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, theme.areaTop)
            gradient.addColorStop(1, theme.areaBottom)
            return gradient
          },
          borderWidth: 2.5,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: theme.primary,
          pointHoverBorderColor: theme.card,
          pointHoverBorderWidth: 2,
          tension: 0.35,
        },
      ],
    }
  }, [current, previous, metric, labelFmt, theme])

  const options = useMemo(() => {
    const base = baseOptions(theme) as ChartOptions<'line'>
    return {
      ...base,
      plugins: {
        ...base.plugins,
        legend: {
          ...base.plugins?.legend,
          display: previous.length > 0,
        },
      },
    } satisfies ChartOptions<'line'>
  }, [theme, previous.length])

  return (
    <div className="relative h-52 w-full touch-pan-y sm:h-56">
      <Line data={data} options={options} aria-label="Visualizações por dia" />
    </div>
  )
}

export function AnalyticsBarChart({
  current,
  metric,
  labelFmt,
}: {
  current: AnalyticsBucket[]
  metric: Metric
  labelFmt?: (bucket: string) => string
}) {
  const theme = useChartTheme()
  const dense = current.length > 14

  const data = useMemo(() => {
    const labels = current.map((bucket) =>
      labelFmt ? labelFmt(bucket.bucket) : bucket.bucket,
    )
    return {
      labels,
      datasets: [
        {
          label: 'Visualizações',
          data: current.map((bucket) => bucket[metric]),
          backgroundColor: withAlpha(theme.primary, 0.85),
          hoverBackgroundColor: theme.primary,
          borderRadius: 4,
          borderSkipped: false as const,
          maxBarThickness: dense ? 18 : 28,
        },
      ],
    }
  }, [current, metric, labelFmt, theme, dense])

  const options = useMemo(() => {
    const base = baseOptions(theme) as ChartOptions<'bar'>
    return {
      ...base,
      plugins: {
        ...base.plugins,
        legend: { display: false },
      },
      scales: {
        ...base.scales,
        x: {
          ...base.scales?.x,
          ticks: {
            ...base.scales?.x?.ticks,
            maxTicksLimit: dense ? 8 : 12,
          },
        },
      },
    } satisfies ChartOptions<'bar'>
  }, [theme, dense])

  return (
    <div className="relative h-52 w-full touch-pan-y sm:h-56">
      <Bar data={data} options={options} aria-label="Visualizações por hora" />
    </div>
  )
}
