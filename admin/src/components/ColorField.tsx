import { useEffect, useMemo, useRef, useState } from 'react'
import { buildGlowColor, cssToHex, hexToHsv, hsvToHex, parseColorAlpha } from '../lib/color'

interface ColorInputProps {
  value: string
  onChange: (hex: string) => void
  title?: string
}

const HUE_GRADIENT =
  'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

// Seletor de cor próprio (sem o <input type="color"> nativo, que traz o
// conta-gotas do Chrome e causava o travamento). Área de saturação/brilho +
// slider de matiz + campo hex, com commit debounced para o pai.
export function ColorInput({ value, onChange, title }: ColorInputProps) {
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState(() => hexToHsv(value))
  const [hexText, setHexText] = useState(value)
  const timer = useRef<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setHsv(hexToHsv(value))
      setHexText(value)
    }
    // Sincroniza a partir do valor externo apenas ao abrir o popover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function commit(hex: string) {
    setHexText(hex)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onChange(hex), 60)
  }

  function updateHsv(next: Partial<{ h: number; s: number; v: number }>) {
    const merged = { ...hsv, ...next }
    setHsv(merged)
    commit(hsvToHex(merged.h, merged.s, merged.v))
  }

  function handleSv(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    updateHsv({
      s: clamp01((e.clientX - rect.left) / rect.width),
      v: clamp01(1 - (e.clientY - rect.top) / rect.height),
    })
  }

  const hueHex = hsvToHex(hsv.h, 1, 1)

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className="color-picker"
        style={{ background: value }}
        title={title ?? 'Selecionar cor'}
        onClick={() => setOpen((o) => !o)}
        aria-label={title ?? 'Selecionar cor'}
      />

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[210px] rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div
            className="relative h-32 w-full cursor-crosshair rounded-lg"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueHex})`,
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              handleSv(e)
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) handleSv(e)
            }}
          >
            <span
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                background: hsvToHex(hsv.h, hsv.s, hsv.v),
              }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={360}
            value={Math.round(hsv.h)}
            onChange={(e) => updateHsv({ h: Number(e.target.value) })}
            className="mt-3 w-full"
            style={{ background: HUE_GRADIENT, borderRadius: '9999px' }}
            aria-label="Matiz"
          />

          <div className="mt-3 flex items-center gap-2">
            <span
              className="h-7 w-7 shrink-0 rounded-md border border-border"
              style={{ background: hexText }}
            />
            <input
              type="text"
              value={hexText}
              onChange={(e) => {
                const next = e.target.value
                setHexText(next)
                if (/^#[0-9a-f]{6}$/i.test(next)) {
                  setHsv(hexToHsv(next))
                  commit(next)
                }
              }}
              className="flex-1 text-xs"
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

export function ColorField({ label, value, onChange, hint }: ColorFieldProps) {
  const pickerValue = useMemo(() => cssToHex(value), [value])

  return (
    <div className="field">
      <label>{label}</label>
      <div className="flex items-center gap-2">
        <ColorInput value={pickerValue} onChange={onChange} title="Selecionar cor" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#e8a838 ou oklch(...)"
          className="flex-1"
        />
        <span
          className="h-9 w-9 shrink-0 rounded-lg border border-border"
          style={{ background: value || pickerValue }}
          title="Prévia"
        />
      </div>
      {hint && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

interface GlowColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function GlowColorField({ label, value, onChange }: GlowColorFieldProps) {
  const { hex, opacity } = useMemo(() => parseColorAlpha(value), [value])
  const percent = Math.round(opacity * 100)

  return (
    <div className="field">
      <label>{label}</label>
      <div className="flex items-center gap-2">
        <ColorInput
          value={hex}
          onChange={(h) => onChange(buildGlowColor(h, opacity))}
          title="Cor do brilho"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <span
          className="h-9 w-9 shrink-0 rounded-lg border border-border"
          style={{ background: value || buildGlowColor(hex, opacity) }}
          title="Prévia"
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => onChange(buildGlowColor(hex, Number(e.target.value) / 100))}
          className="flex-1 accent-[var(--color-primary)]"
        />
        <span className="w-10 text-right text-xs text-muted-foreground">{percent}%</span>
      </div>
    </div>
  )
}
