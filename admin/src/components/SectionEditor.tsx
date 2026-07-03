import { useState } from 'react'
import type { BioSection, SectionItem, AppHeroPreset } from '@bio-types'
import { APP_HERO_PRESET_LIST, CARD_TYPES, createAppHero, createItem, LAYOUT_OPTIONS } from '../lib/bio'
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
    onChange({ ...section, items })
  }

  function removeItem(index: number) {
    onChange({ ...section, items: section.items.filter((_, i) => i !== index) })
  }

  function moveItem(from: number, to: number) {
    if (from === to) return
    const items = [...section.items]
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    onChange({ ...section, items })
  }

  function addItem(type: SectionItem['type']) {
    onChange({ ...section, items: [...section.items, createItem(type)] })
  }

  function addAppHero(preset: AppHeroPreset) {
    onChange({ ...section, items: [...section.items, createAppHero(preset)] })
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
              onChange={(e) => onChange({ ...section, id: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Layout</label>
            <select
              value={section.layout ?? 'stack'}
              onChange={(e) =>
                onChange({
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
          </div>
          <div className="field sm:col-span-2">
            <label>Título da seção</label>
            <input
              value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
              placeholder='Deixe vazio para ocultar: ""'
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Subtítulo</label>
            <input
              value={section.subtitle ?? ''}
              onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
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
              onChange={(updated) => updateItem(index, updated)}
              onRemove={() => removeItem(index)}
              collapsed={collapsed.has(index)}
              onToggleCollapse={() => toggleCollapse(index)}
              dragHandle={
                <span
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => {
                    setDragIndex(null)
                    setDropIndex(null)
                  }}
                  className="cursor-grab select-none px-1 text-lg leading-none text-muted-foreground/60 active:cursor-grabbing"
                  title="Arraste para reordenar"
                  aria-hidden="true"
                >
                  ⠿
                </span>
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
