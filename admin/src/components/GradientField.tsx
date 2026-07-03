import { useMemo } from 'react'
import { cssToHex } from '../lib/color'
import { ColorInput } from './ColorField'

interface GradientFieldProps {
  label: string
  value?: string
  onChange: (value: string) => void
}

interface ParsedGradient {
  angle: number
  from: string
  to: string
}

function parseGradient(value?: string): ParsedGradient {
  const fallback: ParsedGradient = { angle: 135, from: '#e8a838', to: '#c25a2b' }
  if (!value) return fallback

  const angleMatch = value.match(/(\d+)deg/)
  const colorMatches = value.match(/(#[0-9a-f]{3,8}|oklch\([^)]*\)|rgb[a]?\([^)]*\)|hsl[a]?\([^)]*\))/gi)

  return {
    angle: angleMatch ? Number(angleMatch[1]) : fallback.angle,
    from: colorMatches?.[0] ? cssToHex(colorMatches[0], fallback.from) : fallback.from,
    to: colorMatches?.[1] ? cssToHex(colorMatches[1], fallback.to) : fallback.to,
  }
}

function buildGradient({ angle, from, to }: ParsedGradient): string {
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`
}

export function GradientField({ label, value, onChange }: GradientFieldProps) {
  const parsed = useMemo(() => parseGradient(value), [value])

  function set(next: Partial<ParsedGradient>) {
    onChange(buildGradient({ ...parsed, ...next }))
  }

  return (
    <div className="field">
      <label>{label}</label>

      <div
        className="mb-2 h-12 w-full rounded-lg border border-border"
        style={{ background: value || buildGradient(parsed) }}
        title="Prévia do gradiente"
      />

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <ColorInput value={parsed.from} onChange={(from) => set({ from })} title="Cor inicial" />
          <span className="text-[9px] text-muted-foreground">Início</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <ColorInput value={parsed.to} onChange={(to) => set({ to })} title="Cor final" />
          <span className="text-[9px] text-muted-foreground">Fim</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={360}
              value={parsed.angle}
              onChange={(e) => set({ angle: Number(e.target.value) })}
              className="flex-1 accent-[var(--color-primary)]"
            />
            <span className="w-12 text-right text-xs text-muted-foreground">{parsed.angle}°</span>
          </div>
          <p className="mt-1 text-[9px] text-muted-foreground/70">Ângulo</p>
        </div>
      </div>

      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 text-xs"
        placeholder="linear-gradient(...)"
      />
    </div>
  )
}
