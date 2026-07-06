import { X } from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { PreviewPanel } from './PreviewPanel'

interface PreviewSheetProps {
  config: BioConfig
  open: boolean
  onClose: () => void
}

export function PreviewSheet({ config, open, onClose }: PreviewSheetProps) {
  if (!open) return null

  return (
    <div className="preview-sheet-root md:hidden" role="presentation">
      <button type="button" className="preview-sheet-backdrop" aria-label="Fechar preview" onClick={onClose} />
      <div className="preview-sheet-panel" role="dialog" aria-modal="true" aria-label="Preview da bio">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Preview da bio</p>
          <button
            type="button"
            className="topbar-btn !border-border !bg-card !text-foreground"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <PreviewPanel config={config} compact />
        </div>
      </div>
    </div>
  )
}
