import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { BioSection, SectionItem, AppHeroPreset } from '@bio-types'
import {
  APP_HERO_PRESET_LIST,
  CARD_TYPES,
  cloneItem,
  createAppHero,
  createItem,
  ensureGridHeroLayouts,
  LAYOUT_OPTIONS,
  newHeroItemForSection,
} from '../lib/bio'
import { ItemEditor } from './ItemEditor'

interface SectionEditorProps {
  section: BioSection
  onChange: (section: BioSection) => void
  onRemove: () => void
}

export function SectionEditor({ section, onChange, onRemove }: SectionEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const isGridSection = (section.layout ?? 'stack') === 'grid-2'

  function patchSection(next: BioSection) {
    onChange(ensureGridHeroLayouts(next))
  }

  useEffect(() => {
    const fixed = ensureGridHeroLayouts(section)
    const changed = fixed.items.some((item, index) => item !== section.items[index])
    if (changed) onChange(fixed)
    // Normaliza heroes legados ao abrir seção em grade 2 colunas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id, section.layout])

  function toggleCollapse(index: number) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function collapseAll() {
    setCollapsed(new Set(section.items.map((_, i) => i)))
  }

  function expandAll() {
    setCollapsed(new Set())
  }

  function updateItem(index: number, item: SectionItem) {
    const items = [...section.items]
    items[index] = item
    patchSection({ ...section, items })
  }

  function removeItem(index: number) {
    patchSection({ ...section, items: section.items.filter((_, i) => i !== index) })
  }

  function moveItem(from: number, to: number) {
    if (from === to) return
    const items = [...section.items]
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    patchSection({ ...section, items })
  }

  function duplicateItem(index: number) {
    const items = [...section.items]
    items.splice(index + 1, 0, cloneItem(section.items[index]))
    patchSection({ ...section, items })
  }

  function addItem(type: SectionItem['type']) {
    const item = createItem(type)
    const normalized =
      item.type === 'whatsapp-hero' || item.type === 'app-hero'
        ? newHeroItemForSection(section, item)
        : item
    patchSection({ ...section, items: [...section.items, normalized] })
  }

  function addAppHero(preset: AppHeroPreset) {
    const hero = newHeroItemForSection(section, createAppHero(preset))
    patchSection({ ...section, items: [...section.items, hero] })
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold">Configuração da seção</h3>
          <button type="button" className="btn-danger px-3 py-1.5 text-xs" onClick={onRemove}>
            Excluir seção
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="field">
            <label>ID interno</label>
            <input
              value={section.id}
              onChange={(e) => patchSection({ ...section, id: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Layout</label>
            <select
              value={section.layout ?? 'stack'}
              onChange={(e) =>
                patchSection({
                  ...section,
                  layout: e.target.value as BioSection['layout'],
                })
              }
            >
              {LAYOUT_OPTIONS.map((layout) => (
                <option key={layout.value} value={layout.value}>
                  {layout.label}
                </option>
              ))}
            </select>
            {isGridSection && (
              <p className="mt-1 text-[10px] text-muted-foreground/75">
                Cards destaque usam layout compacto ou condensado — completo fica desativado.
              </p>
            )}
          </div>
          <div className="field sm:col-span-2">
            <label>Título da seção</label>
            <input
              value={section.title}
              onChange={(e) => patchSection({ ...section, title: e.target.value })}
              placeholder='Deixe vazio para ocultar: ""'
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Subtítulo</label>
            <input
              value={section.subtitle ?? ''}
              onChange={(e) => patchSection({ ...section, subtitle: e.target.value })}
            />
          </div>
        </div>
      </div>

      {section.items.length > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={collapseAll}>
            Recolher todos
          </button>
          <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={expandAll}>
            Expandir todos
          </button>
        </div>
      )}

      <div className="space-y-3">
        {section.items.map((item, index) => (
          <div
            key={`${section.id}-${index}`}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragIndex !== null && dropIndex !== index) setDropIndex(index)
            }}
            onDrop={() => {
              if (dragIndex !== null) moveItem(dragIndex, index)
              setDragIndex(null)
              setDropIndex(null)
            }}
            className={`rounded-xl transition-shadow ${
              dropIndex === index && dragIndex !== index ? 'ring-2 ring-primary' : ''
            } ${dragIndex === index ? 'opacity-50' : ''}`}
          >
            <ItemEditor
              item={item}
              isGridSection={isGridSection}
              onChange={(updated) => updateItem(index, updated)}
              onRemove={() => removeItem(index)}
              onDuplicate={() => duplicateItem(index)}
              collapsed={collapsed.has(index)}
              onToggleCollapse={() => toggleCollapse(index)}
              dragHandle={
                <div className="flex shrink-0 items-center gap-0.5">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => moveItem(index, index - 1)}
                      aria-label="Mover card para cima"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      disabled={index === section.items.length - 1}
                      onClick={() => moveItem(index, index + 1)}
                      aria-label="Mover card para baixo"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setDropIndex(null)
                    }}
                    className="hidden cursor-grab select-none px-0.5 text-lg leading-none text-muted-foreground/60 active:cursor-grabbing sm:inline"
                    title="Arraste para reordenar"
                    aria-hidden="true"
                  >
                    ⠿
                  </span>
                </div>
              }
            />
          </div>
        ))}
      </div>

      <div className="card space-y-4">
        <div>
          <p className="mb-3 text-sm font-medium">Destaque de app</p>
          <div className="flex flex-wrap gap-2">
            {APP_HERO_PRESET_LIST.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                onClick={() => addAppHero(preset.value)}
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Outros cards</p>
          <div className="flex flex-wrap gap-2">
            {CARD_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                onClick={() => addItem(type.value)}
              >
                + {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
