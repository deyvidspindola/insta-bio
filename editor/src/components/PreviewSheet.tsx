import { X } from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { PreviewPanel, type PreviewFocus } from './PreviewPanel'

interface PreviewSheetProps {
  config: BioConfig
  open: boolean
  onClose: () => void
  focus?: PreviewFocus | null
}

/** Preview dockado no mobile: metade inferior da tela, formulário continua editável. */
export function PreviewSheet({ config, open, onClose, focus = null }: PreviewSheetProps) {
  if (!open) return null

  return (
    <div className="preview-sheet-root preview-sheet-root--dock md:hidden" role="presentation">
      <div
        className="preview-sheet-panel preview-sheet-panel--dock"
        role="dialog"
        aria-modal="false"
        aria-label="Preview da bio"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div>
            <p className="text-sm font-semibold">Preview ao vivo</p>
            <p className="text-[10px] text-muted-foreground">Continue editando acima — o preview atualiza sozinho</p>
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
        <div className="overflow-y-auto px-3 py-3">
          <PreviewPanel config={config} compact focus={focus} />
        </div>
      </div>
    </div>
  )
}
