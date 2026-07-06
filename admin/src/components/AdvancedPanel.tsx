import { useState } from 'react'
import { Copy, Download, RotateCcw, Upload } from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { ConfirmDialog } from './ConfirmDialog'
import { JsonPanel } from './JsonPanel'

interface AdvancedPanelProps {
  config: BioConfig
  onImport: (file: File) => void
  onCopy: () => void
  onDownload: () => void
  onRestoreDefault: () => void
}

export function AdvancedPanel({
  config,
  onImport,
  onCopy,
  onDownload,
  onRestoreDefault,
}: AdvancedPanelProps) {
  const [confirmRestore, setConfirmRestore] = useState(false)

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">Arquivo da bio</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Importar, exportar ou copiar o <code className="text-[11px]">bio.json</code>. Use com cuidado — alterações aqui substituem tudo.
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-xs">
            <Upload className="h-4 w-4" />
            Importar JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImport(file)
                e.currentTarget.value = ''
              }}
            />
          </label>
          <button type="button" className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs" onClick={onCopy}>
            <Copy className="h-4 w-4" />
            Copiar JSON
          </button>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
            Baixar bio.json
          </button>
        </div>
      </div>

      <div className="card border-red-500/20">
        <h3 className="mb-1 text-sm font-semibold text-red-400">Zona de risco</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Restaura o modelo padrão do insta-bio. Todas as seções e personalizações serão perdidas.
        </p>
        <button
          type="button"
          className="btn-danger inline-flex items-center gap-2 px-3 py-2 text-xs"
          onClick={() => setConfirmRestore(true)}
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar modelo padrão
        </button>
      </div>

      <JsonPanel config={config} />

      <ConfirmDialog
        open={confirmRestore}
        title="Restaurar modelo padrão?"
        description="Isso substitui toda a configuração atual pelo template inicial. Não é possível desfazer após salvar."
        confirmLabel="Restaurar"
        variant="danger"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => {
          onRestoreDefault()
          setConfirmRestore(false)
        }}
      />
    </div>
  )
}
