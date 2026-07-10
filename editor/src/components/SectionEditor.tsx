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
import { ConfirmDialog } from './ConfirmDialog'
import { ItemEditor } from './ItemEditor'

interface SectionEditorProps {
  section: BioSection
  onChange: (section: BioSection) => void
  onRemove: () => void
  onFocusItem?: (index: number | null) => void
  /** Abre este card (ex.: clique no preview) e fecha os demais */
  openItemRequest?: { index: number; nonce: number } | null
}

export function SectionEditor({
  section,
  onChange,
  onRemove,
  onFocusItem,
  openItemRequest = null,
}: SectionEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  /** Índice do único card expandido; null = todos recolhidos */
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [confirmRemoveSection, setConfirmRemoveSection] = useState(false)
  const [confirmRemoveItem, setConfirmRemoveItem] = useState<number | null>(null)

  const isGridSection = (section.layout ?? 'stack') === 'grid-2'

  function patchSection(next: BioSection) {
    onChange(ensureGridHeroLayouts(next))
  }

  function openOnly(index: number) {
    setExpandedIndex(index)
    onFocusItem?.(index)
  }

  useEffect(() => {
    setExpandedIndex(null)
    onFocusItem?.(null)
    // Ao trocar de seção, recolhe todos os cards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id])

  useEffect(() => {
    if (!openItemRequest) return
    if (openItemRequest.index < 0 || openItemRequest.index >= section.items.length) return
    openOnly(openItemRequest.index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openItemRequest?.nonce, openItemRequest?.index, section.id])

  useEffect(() => {
    const fixed = ensureGridHeroLayouts(section)
    const changed = fixed.items.some((item, index) => item !== section.items[index])
    if (changed) onChange(fixed)
    // Normaliza heroes legados ao abrir seção em grade 2 colunas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id, section.layout])

  /** Seta do acordeão: abre este (fechando os outros) ou fecha se já estiver aberto. */
  function toggleCollapse(index: number) {
    if (expandedIndex === index) {
      setExpandedIndex(null)
      return
    }
    openOnly(index)
  }

  function collapseAll() {
    setExpandedIndex(null)
    onFocusItem?.(null)
  }

  function updateItem(index: number, item: SectionItem) {
    const items = [...section.items]
    items[index] = item
    patchSection({ ...section, items })
    onFocusItem?.(index)
  }

  function removeItem(index: number) {
    patchSection({ ...section, items: section.items.filter((_, i) => i !== index) })
    setExpandedIndex((current) => {
      if (current === null) return null
      if (current === index) return null
      if (current > index) return current - 1
      return current
    })
    onFocusItem?.(null)
    setConfirmRemoveItem(null)
  }

  function moveItem(from: number, to: number) {
    if (from === to) return
    const items = [...section.items]
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    patchSection({ ...section, items })
    setExpandedIndex((current) => {
      if (current === null) return null
      if (current === from) return to
      if (from < current && to >= current) return current - 1
      if (from > current && to <= current) return current + 1
      return current
    })
    onFocusItem?.(to)
  }

  function duplicateItem(index: number) {
    const items = [...section.items]
    items.splice(index + 1, 0, cloneItem(section.items[index]))
    patchSection({ ...section, items })
    openOnly(index + 1)
  }

  function addItem(type: SectionItem['type']) {
    const item = createItem(type)
    const normalized =
      item.type === 'whatsapp-hero' || item.type === 'app-hero'
        ? newHeroItemForSection(section, item)
        : item
    const newIndex = section.items.length
    patchSection({ ...section, items: [...section.items, normalized] })
    openOnly(newIndex)
  }

  function addAppHero(preset: AppHeroPreset) {
    const hero = newHeroItemForSection(section, createAppHero(preset))
    const newIndex = section.items.length
    patchSection({ ...section, items: [...section.items, hero] })
    openOnly(newIndex)
  }

  const pendingItem =
    confirmRemoveItem !== null ? section.items[confirmRemoveItem] : null
  const pendingItemTitle =
    pendingItem && 'title' in pendingItem && pendingItem.title
      ? pendingItem.title
      : pendingItem
        ? 'este card'
        : ''

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold">Configuração da seção</h3>
          <button
            type="button"
            className="btn-danger px-3 py-1.5 text-xs"
            onClick={() => setConfirmRemoveSection(true)}
          >
            Excluir seção
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                Em grade, destaques de app usam layout compacto — o completo fica desativado.
              </p>
            )}
          </div>
          <div className="field sm:col-span-2">
            <label>Título da seção</label>
            <input
              value={section.title}
              onChange={(e) => patchSection({ ...section, title: e.target.value })}
              placeholder="Deixe vazio para ocultar o título na bio"
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

        <details className="mt-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground">
            Avançado
          </summary>
          <div className="field mt-2">
            <label>ID interno</label>
            <input
              value={section.id}
              onChange={(e) => patchSection({ ...section, id: e.target.value })}
            />
            <p className="mt-1 text-[10px] text-muted-foreground/75">
              Usado só internamente. Prefira alterar o título acima.
            </p>
          </div>
        </details>
      </div>

      {section.items.length > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={collapseAll}>
            Recolher todos
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
              onRemove={() => setConfirmRemoveItem(index)}
              onDuplicate={() => duplicateItem(index)}
              collapsed={expandedIndex !== index}
              onToggleCollapse={() => toggleCollapse(index)}
              onSelect={() => openOnly(index)}
              onFocus={() => onFocusItem?.(index)}
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
          <p className="mb-1 text-sm font-medium">Destaque de app</p>
          <p className="mb-3 text-[10px] text-muted-foreground">
            Atalhos prontos (WhatsApp, Instagram, etc.) com visual de destaque.
          </p>
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
          <p className="mb-1 text-sm font-medium">Outros cards</p>
          <p className="mb-3 text-[10px] text-muted-foreground">
            <strong className="font-medium text-foreground/85">Destaque</strong> = card visual.{' '}
            <strong className="font-medium text-foreground/85">Link simples</strong> = botão clássico.
          </p>
          <div className="flex flex-wrap gap-2">
            {CARD_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                title={type.hint}
                onClick={() => addItem(type.value)}
              >
                + {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemoveSection}
        title="Excluir esta seção?"
        description={
          <>
            Todos os cards desta seção serão removidos do editor. Você ainda precisa{' '}
            <span className="font-medium text-foreground">Salvar</span> ou{' '}
            <span className="font-medium text-foreground">Publicar</span> para gravar a alteração.
          </>
        }
        confirmLabel="Excluir seção"
        variant="danger"
        onConfirm={() => {
          setConfirmRemoveSection(false)
          onRemove()
        }}
        onCancel={() => setConfirmRemoveSection(false)}
      />

      <ConfirmDialog
        open={confirmRemoveItem !== null}
        title="Remover card?"
        description={
          <>
            Remover <span className="font-medium text-foreground">{pendingItemTitle}</span> desta
            seção? A alteração só fica permanente após salvar ou publicar.
          </>
        }
        confirmLabel="Remover"
        variant="danger"
        onConfirm={() => {
          if (confirmRemoveItem !== null) removeItem(confirmRemoveItem)
        }}
        onCancel={() => setConfirmRemoveItem(null)}
      />
    </div>
  )
}
