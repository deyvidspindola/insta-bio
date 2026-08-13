import { useEffect } from 'react'
import { Copy, X } from 'lucide-react'
import { resolvePublicUrl } from '@site/lib/publicUrl'
import { formatFileSize, isVideoAsset, type AssetFile } from '../lib/assets'

interface AssetPreviewModalProps {
  file: AssetFile | null
  onClose: () => void
  onCopyPath?: (path: string) => void
}

export function AssetPreviewModal({ file, onClose, onCopyPath }: AssetPreviewModalProps) {
  useEffect(() => {
    if (!file) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [file, onClose])

  if (!file) return null

  const url = resolvePublicUrl(file.path)
  const isVideo = isVideoAsset(file.name)

  return (
    <div className="asset-preview-root" role="presentation">
      <button
        type="button"
        className="confirm-dialog-backdrop"
        aria-label="Fechar visualização"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isVideo ? 'Visualizar vídeo' : 'Visualizar imagem'}
        className="asset-preview-panel"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold" title={file.name}>
              {file.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} ·{' '}
              {new Date(file.modified * 1000).toLocaleString('pt-BR')}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary flex h-9 w-9 shrink-0 items-center justify-center p-0"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="asset-preview-media">
          {isVideo ? (
            <video
              key={url}
              src={url}
              className="max-h-[min(70vh,640px)] w-full rounded-lg bg-black object-contain"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={url}
              alt={file.name}
              className="max-h-[min(70vh,640px)] w-full rounded-lg object-contain"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <code className="truncate text-xs text-muted-foreground">{file.path}</code>
          {onCopyPath && (
            <button
              type="button"
              className="btn-secondary inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs"
              onClick={() => onCopyPath(file.path)}
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar caminho
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
