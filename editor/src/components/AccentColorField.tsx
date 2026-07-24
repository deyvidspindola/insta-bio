import { useMemo } from 'react'
import { DEFAULT_ACCENT } from '@site/lib/accentTheme'
import { buildGlowColor, cssToHex, parseColorAlpha } from '../lib/color'
import { ColorInput } from './ColorField'

/**
 * Cor de destaque — seletor igual ao dos links (ColorInput) + transparência.
 * 100% = preenchimento sólido (templates Sólido / Pill).
 * Menos % = mesma cor mais transparente.
 */
export function AccentColorField({
  value,
  onChange,
  fallback = DEFAULT_ACCENT,
}: {
  value?: string
  onChange: (accentColor: string | undefined) => void
  fallback?: string
}) {
  const resolved = value?.trim() || fallback
  const { hex, opacity } = useMemo(() => {
    if (!value?.trim()) return { hex: cssToHex(fallback, fallback), opacity: 1 }
    const parsed = parseColorAlpha(resolved)
    return {
      hex: cssToHex(resolved, fallback),
      opacity: Number.isFinite(parsed.opacity) ? parsed.opacity : 1,
    }
  }, [value, fallback, resolved])

  const percent = Math.round(opacity * 100)
  const preview = buildGlowColor(hex, opacity)

  function commit(nextHex: string, nextOpacity: number) {
    if (nextOpacity >= 0.995) {
      onChange(nextHex)
      return
    }
    onChange(buildGlowColor(nextHex, nextOpacity))
  }

  return (
    <div className="field">
      <label>Cor do card</label>

      <div className="flex items-center gap-2">
        <ColorInput
          value={hex}
          onChange={(next) => commit(next, opacity)}
          title="Selecionar cor sólida"
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => {
            const next = e.target.value.trim()
            onChange(next ? next : undefined)
          }}
          placeholder={fallback}
          className="flex-1"
        />
        <span
          className="h-9 w-9 shrink-0 rounded-lg border border-border"
          style={{
            background: `
              linear-gradient(${preview}, ${preview}),
              repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%)
                0 0 / 10px 10px
            `,
          }}
          title="Prévia"
        />
      </div>

      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min={10}
          max={100}
          value={percent}
          onChange={(e) => commit(hex, Number(e.target.value) / 100)}
          className="color-opacity-slider flex-1"
          aria-label="Transparência do preenchimento"
        />
        <span className="w-10 text-right text-xs text-muted-foreground">{percent}%</span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground/70">
        100% = sólido (como links Sólido/Pill). Diminua para deixar o fundo mais transparente.
      </p>
    </div>
  )
}
