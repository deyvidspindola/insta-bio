import type { ReactNode } from 'react'
import type { SectionItem } from '@bio-types'
import { itemHasScheduleWindow } from '@site/lib/cardSchedule'
import { ItemTypeFields } from './item-editors/ItemTypeFields'
import { itemPreviewTitle, itemTypeLabel } from './item-editors/itemLabels'
import { ScheduleFields } from './item-editors/ScheduleFields'

interface ItemEditorProps {
  item: SectionItem
  isGridSection?: boolean
  onChange: (item: SectionItem) => void
  onRemove: () => void
  onDuplicate?: () => void
  dragHandle?: ReactNode
  collapsed?: boolean
  onToggleCollapse?: () => void
  /** Abre este card (acordeão) ao clicar no cabeçalho */
  onSelect?: () => void
  onFocus?: () => void
}

export function ItemEditor({
  item,
  isGridSection = false,
  onChange,
  onRemove,
  onDuplicate,
  dragHandle,
  collapsed = false,
  onToggleCollapse,
  onSelect,
  onFocus,
}: ItemEditorProps) {
  const typeLabel = itemTypeLabel(item)

  function selectCard() {
    onFocus?.()
    if (collapsed) onSelect?.()
  }

  return (
    <div
      className={`card min-w-0 ${collapsed ? '' : 'space-y-3'} ${
        !collapsed ? 'ring-1 ring-primary/35' : ''
      }`}
      onFocusCapture={() => onFocus?.()}
    >
      <div
        className={`flex items-center justify-between gap-3 ${
          collapsed ? 'cursor-pointer rounded-lg' : ''
        }`}
        onClick={(e) => {
          if (!collapsed) return
          const target = e.target as HTMLElement
          if (target.closest('button, a, input, select, textarea')) return
          selectCard()
        }}
        onKeyDown={(e) => {
          if (!collapsed) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            selectCard()
          }
        }}
        role={collapsed ? 'button' : undefined}
        tabIndex={collapsed ? 0 : undefined}
      >
        <div className="flex min-w-0 items-center gap-2">
          {dragHandle}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse()
              }}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              title={collapsed ? 'Expandir' : 'Recolher'}
              aria-expanded={!collapsed}
            >
              <span className="inline-block w-4 text-center text-xs">{collapsed ? '▸' : '▾'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              selectCard()
            }}
            className="min-w-0 text-left"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{typeLabel}</p>
            <p className="truncate font-medium">{itemPreviewTitle(item)}</p>
            {(item.schedule !== undefined || itemHasScheduleWindow(item)) && (
              <p className="mt-0.5 text-[10px] font-medium text-primary">
                {itemHasScheduleWindow(item) ? 'Agendado' : 'Agendamento (sem datas)'}
              </p>
            )}
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onDuplicate && (
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-xs"
              onClick={onDuplicate}
            >
              Clonar
            </button>
          )}
          <button
            type="button"
            className="btn-danger shrink-0 px-3 py-1.5 text-xs"
            onClick={onRemove}
          >
            Remover
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <>
          <ScheduleFields item={item} onChange={onChange} />
          <ItemTypeFields item={item} isGridSection={isGridSection} onChange={onChange} />
        </>
      )}
    </div>
  )
}
