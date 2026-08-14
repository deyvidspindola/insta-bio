import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { BioBrand, BioSection, SectionItem, AppHeroPreset } from '@bio-types'
import {
  cloneItem,
  createAppHero,
  createItem,
  createSimpleLink,
  ensureGridHeroLayouts,
  LAYOUT_OPTIONS,
  newHeroItemForSection,
} from '../lib/bio'
import { AddBlockPicker } from './AddBlockPicker'
import { ConfirmDialog } from './ConfirmDialog'
import { ItemEditor } from './ItemEditor'
import { QuickAddLink } from './QuickAddLink'

interface SectionEditorProps {
  section: BioSection
  theme?: BioBrand['theme']
  onChange: (section: BioSection) => void
  onRemove: () => void
  onFocusItem?: (index: number | null) => void
  /** Abre este card (ex.: clique no preview) e fecha os demais */
  openItemRequest?: { index: number; nonce: number } | null
  isOnlySection?: boolean
  onAddSection?: () => void
}

export function SectionEditor({
  section,
  theme,
  onChange,
  onRemove,
  onFocusItem,
  openItemRequest = null,
  isOnlySection = true,
  onAddSection,
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
    const item = createItem(type, theme)
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

  function addSimpleLink(title: string, url: string) {
    const newIndex = section.items.length
    patchSection({ ...section, items: [...section.items, createSimpleLink(title, url)] })
    openOnly(newIndex)
  }

  const pendingItem =
    confirmRemoveItem !== null ? section.items[confirmRemoveItem] : null
  const pendingItemTitle =
    pendingItem && 'title' in pendingItem && pendingItem.title
      ? pendingItem.title
      : pendingItem?.type === 'text'
        ? pendingItem.text.trim() || 'este texto'
        : pendingItem?.type === 'list'
          ? pendingItem.items.find((entry) => entry.trim())?.trim() || 'esta lista'
          : pendingItem
            ? 'este card'
            : ''

  return (
    <div className="min-w-0 space-y-4">
      <QuickAddLink onAdd={addSimpleLink} />

      {section.items.length === 0 && (
        <p className="px-1 text-center text-[12px] leading-snug text-muted-foreground">
          Ainda não há links neste grupo. Adicione o primeiro acima.
        </p>
      )}

      {section.items.length > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary min-h-10 px-3 py-1.5 text-xs" onClick={collapseAll}>
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

      <AddBlockPicker onAddItem={addItem} onAddAppHero={addAppHero} />

      <details className="card">
        <summary className="cursor-pointer list-none">
          <div className="flex min-h-12 items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-semibold">Opções do grupo</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                Título na bio, layout e agrupamento. Opcional — a maioria das bios usa uma lista só.
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform" aria-hidden="true" />
          </div>
        </summary>

        <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
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
              <label>Nome do grupo</label>
              <input
                value={section.title}
                onChange={(e) => patchSection({ ...section, title: e.target.value })}
                placeholder="Ex.: Links, Eventos…"
              />
            </div>
            <div className="field sm:col-span-2">
              <label>Subtítulo</label>
              <input
                value={section.subtitle ?? ''}
                onChange={(e) => patchSection({ ...section, subtitle: e.target.value })}
              />
            </div>
            <label className="field sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-muted/10 px-3 py-2.5">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={Boolean(section.hideTitle)}
                onChange={(e) =>
                  patchSection({
                    ...section,
                    hideTitle: e.target.checked ? true : undefined,
                  })
                }
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Ocultar nome na bio
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  O nome continua só no editor, para você organizar.
                </span>
              </span>
            </label>
          </div>

          <details className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
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
                Usado só internamente. Prefira alterar o nome acima.
              </p>
            </div>
          </details>

          <div className="flex flex-col gap-2 sm:flex-row">
            {onAddSection && (
              <button type="button" className="btn-secondary min-h-11 flex-1 text-sm" onClick={onAddSection}>
                Novo grupo
              </button>
            )}
            {!isOnlySection && (
              <button
                type="button"
                className="btn-danger min-h-11 flex-1 text-sm"
                onClick={() => setConfirmRemoveSection(true)}
              >
                Excluir grupo
              </button>
            )}
          </div>
        </div>
      </details>

      <ConfirmDialog
        open={confirmRemoveSection}
        title="Excluir este grupo?"
        description={
          <>
            Todos os cards deste grupo serão removidos do editor. Você ainda precisa{' '}
            <span className="font-medium text-foreground">Salvar</span> ou{' '}
            <span className="font-medium text-foreground">Publicar</span> para gravar a alteração.
          </>
        }
        confirmLabel="Excluir grupo"
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
            Remover <span className="font-medium text-foreground">{pendingItemTitle}</span> deste
            grupo? A alteração só fica permanente após salvar ou publicar.
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
