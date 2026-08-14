import { useState } from 'react'
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'
import type { BioSection } from '@bio-types'
import { sectionDisplayName } from '../lib/bio'
import { SectionOrderSheet } from './SectionOrderSheet'

interface SectionMobilePickerProps {
  sections: BioSection[]
  activeSection: number
  onSelect: (index: number) => void
  onAdd: () => void
  onReorder: (from: number, to: number) => void
}

export function SectionMobilePicker({
  sections,
  activeSection,
  onSelect,
  onAdd,
  onReorder,
}: SectionMobilePickerProps) {
  const [orderOpen, setOrderOpen] = useState(false)
  const current = sections[activeSection]

  return (
    <>
      <div className="section-mobile-picker sticky top-14 z-20 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              disabled={activeSection === 0}
              onClick={() => onReorder(activeSection, activeSection - 1)}
              aria-label="Mover grupo atual para cima"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              disabled={activeSection === sections.length - 1}
              onClick={() => onReorder(activeSection, activeSection + 1)}
              aria-label="Mover grupo atual para baixo"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <select
            className="min-w-0 flex-1"
            value={activeSection}
            onChange={(e) => onSelect(Number(e.target.value))}
            aria-label="Selecionar grupo"
          >
            {sections.map((section, index) => (
              <option key={section.id} value={index}>
                {sectionDisplayName(section, index)}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-secondary min-h-11 shrink-0 px-3 py-1.5 text-sm"
            onClick={onAdd}
            title="Novo grupo"
            aria-label="Novo grupo"
          >
            + Grupo
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          {current && (
            <p className="min-w-0 flex-1 text-[10px] text-muted-foreground">
              Grupo {activeSection + 1} de {sections.length}
              {current.items.length > 0 && ` · ${current.items.length} cards`}
            </p>
          )}
          {sections.length > 1 && (
            <button
              type="button"
              className="btn-ghost inline-flex shrink-0 items-center gap-1 px-2 py-1 text-[11px]"
              onClick={() => setOrderOpen(true)}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Organizar
            </button>
          )}
        </div>
      </div>

      <SectionOrderSheet
        sections={sections}
        activeSection={activeSection}
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        onReorder={onReorder}
        onSelect={onSelect}
      />
    </>
  )
}

interface SectionSidebarProps {
  sections: BioSection[]
  activeSection: number
  dragIndex: number | null
  dropIndex: number | null
  onSelect: (index: number) => void
  onReorder: (from: number, to: number) => void
  onAdd: () => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
}

export function SectionSidebar({
  sections,
  activeSection,
  dragIndex,
  dropIndex,
  onSelect,
  onReorder,
  onAdd,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: SectionSidebarProps) {
  return (
    <div className="card min-w-0 space-y-2 self-start md:sticky md:top-20 md:max-h-[calc(100vh-6.5rem)] md:overflow-y-auto">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grupos</p>
      <p className="text-[10px] text-muted-foreground/70">Opcional — use só se quiser separar os links</p>
      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => {
            e.preventDefault()
            onDragOver(index)
          }}
          onDrop={() => onDrop(index)}
          onDragEnd={onDragEnd}
          className={`flex items-center gap-1 rounded-lg px-1 py-1 text-xs transition-colors ${
            activeSection === index ? 'bg-muted text-foreground' : 'text-muted-foreground'
          } ${dropIndex === index && dragIndex !== index ? 'ring-1 ring-primary' : ''} ${
            dragIndex === index ? 'opacity-50' : ''
          }`}
        >
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground hover:bg-background/60 hover:text-foreground disabled:opacity-30"
              disabled={index === 0}
              onClick={() => onReorder(index, index - 1)}
              aria-label="Mover grupo para cima"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground hover:bg-background/60 hover:text-foreground disabled:opacity-30"
              disabled={index === sections.length - 1}
              onClick={() => onReorder(index, index + 1)}
              aria-label="Mover grupo para baixo"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <span
            className="hidden cursor-grab select-none px-0.5 text-muted-foreground/60 active:cursor-grabbing sm:inline"
            aria-hidden="true"
            title="Arraste para reordenar"
          >
            ⠿
          </span>
          <button
            type="button"
            className="min-w-0 flex-1 truncate py-1.5 text-left"
            onClick={() => onSelect(index)}
          >
            {sectionDisplayName(section, index)}
          </button>
        </div>
      ))}
      <button type="button" className="btn-secondary min-h-11 w-full py-1.5 text-sm" onClick={onAdd}>
        + Novo grupo
      </button>
    </div>
  )
}
