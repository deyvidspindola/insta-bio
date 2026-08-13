import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Ban, ChevronDown, Search, X } from 'lucide-react'
import type { IconName } from '@bio-types'
import { BioIcon } from '@site/components/icons'
import {
  ICON_CATEGORY_LABELS,
  ICON_LABELS,
  filterIconCatalog,
  type IconCategory,
} from '../lib/iconCatalog'

interface IconPickerProps {
  value?: IconName
  onChange: (value?: IconName) => void
  allowEmpty?: boolean
  label?: string
  /** Só o trigger/painel, sem wrapper .field (ex.: tags) */
  bare?: boolean
}

const CATEGORIES: IconCategory[] = [
  'all',
  'contact',
  'social',
  'faith',
  'business',
  'events',
  'media',
  'general',
]

export function IconPicker({
  value,
  onChange,
  allowEmpty = true,
  label = 'Ícone',
  bare = false,
}: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<IconCategory>('all')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  const filtered = useMemo(() => filterIconCatalog(query, category), [query, category])

  useEffect(() => {
    if (!open) return

    const timer = window.setTimeout(() => searchRef.current?.focus(), 50)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    const prevOverflow = document.body.style.overflow
    if (window.matchMedia('(max-width: 767px)').matches) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  function select(next?: IconName) {
    onChange(next)
    setOpen(false)
    setQuery('')
    setCategory('all')
  }

  const currentLabel = value ? ICON_LABELS[value] ?? value : 'Sem ícone'

  const picker = (
    <>
      <button
        type="button"
        className="icon-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="icon-picker-trigger__preview" aria-hidden="true">
          {value ? <BioIcon name={value} className="h-4 w-4" /> : <Ban className="h-4 w-4 opacity-50" />}
        </span>
        <span className="min-w-0 flex-1 truncate text-left text-sm">{currentLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="icon-picker-backdrop md:hidden"
            aria-label="Fechar seletor de ícones"
            onClick={() => setOpen(false)}
          />
          <div
            className="icon-picker-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 md:hidden">
              <p id={titleId} className="text-sm font-semibold">
                Escolher ícone
              </p>
              <button
                type="button"
                className="btn-ghost px-2 py-1"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar ícone…"
                  className="w-full !pl-8"
                  aria-label="Buscar ícone"
                />
              </div>

              <div className="icon-picker-cats" role="tablist" aria-label="Categorias">
                {CATEGORIES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={category === id}
                    className={`icon-picker-cat ${category === id ? 'active' : ''}`}
                    onClick={() => setCategory(id)}
                  >
                    {ICON_CATEGORY_LABELS[id]}
                  </button>
                ))}
              </div>

              <div className="icon-picker-grid" role="listbox" aria-label="Ícones">
                {allowEmpty && (
                  <button
                    type="button"
                    role="option"
                    aria-selected={!value}
                    className={`icon-picker-cell ${!value ? 'active' : ''}`}
                    onClick={() => select(undefined)}
                    title="Sem ícone"
                  >
                    <Ban className="h-5 w-5 opacity-55" />
                    <span>Nenhum</span>
                  </button>
                )}
                {filtered.map((entry) => {
                  const selected = value === entry.id
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`icon-picker-cell ${selected ? 'active' : ''}`}
                      onClick={() => select(entry.id)}
                      title={entry.label}
                    >
                      <BioIcon name={entry.id} className="h-5 w-5" />
                      <span>{entry.label}</span>
                    </button>
                  )
                })}
              </div>

              {filtered.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum ícone encontrado para “{query}”.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )

  if (bare) {
    return (
      <div className="relative" ref={rootRef}>
        {picker}
      </div>
    )
  }

  return (
    <div className="field relative" ref={rootRef}>
      <label>{label}</label>
      {picker}
    </div>
  )
}
