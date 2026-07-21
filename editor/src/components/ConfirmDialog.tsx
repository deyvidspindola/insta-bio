import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    cancelRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div className="confirm-dialog-root" role="presentation">
      <button
        type="button"
        className="confirm-dialog-backdrop"
        aria-label="Fechar"
        disabled={loading}
        onClick={onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="confirm-dialog-panel"
      >
        <div className="flex w-full items-start gap-3">
          <div
            className={`confirm-dialog-icon ${variant === 'danger' ? 'confirm-dialog-icon-danger' : ''}`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 id="confirm-dialog-title" className="text-base font-semibold">
              {title}
            </h3>
            <div id="confirm-dialog-desc" className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </div>
          </div>
        </div>

        <div className="flex w-full justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="btn-secondary px-4 py-2 text-sm"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={variant === 'danger' ? 'btn-danger px-4 py-2 text-sm' : 'btn-primary px-4 py-2 text-sm'}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
