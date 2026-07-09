import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { BioSection } from '@bio-types'

interface SectionOrderSheetProps {
  sections: BioSection[]
  activeSection: number
  open: boolean
  onClose: () => void
  onReorder: (from: number, to: number) => void
  onSelect: (index: number) => void
}

export function SectionOrderSheet({
  sections,
  activeSection,
  open,
  onClose,
  onReorder,
  onSelect,
}: SectionOrderSheetProps) {
  if (!open) return null

  return (
    <div className="preview-sheet-root md:hidden" role="presentation">
      <button type="button" className="preview-sheet-backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="preview-sheet-panel" role="dialog" aria-modal="true" aria-label="Ordem das seções">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Ordem das seções</p>
            <p className="text-[10px] text-muted-foreground">Use as setas para reorganizar</p>
          </div>
          <button
            type="button"
            className="topbar-btn !border-border !bg-card !text-foreground"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto p-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${
                activeSection === index ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/50'
              }`}
            >
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => onReorder(index, index - 1)}
                  aria-label={`Mover ${section.title || section.id} para cima`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  disabled={index === sections.length - 1}
                  onClick={() => onReorder(index, index + 1)}
                  aria-label={`Mover ${section.title || section.id} para baixo`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                className="min-w-0 flex-1 truncate py-1 text-left text-sm"
                onClick={() => {
                  onSelect(index)
                  onClose()
                }}
              >
                <span className="font-medium">{section.title || section.id}</span>
                {section.items.length > 0 && (
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {section.items.length} {section.items.length === 1 ? 'card' : 'cards'}
                  </span>
                )}
              </button>

              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
