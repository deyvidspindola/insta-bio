import { useEffect, useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { FormField } from '../types/bio'
import { getAnalyticsKey, getVisitorId } from '../lib/analytics'

export type ResolvedFormDefinition = {
  slug: string
  title: string
  description?: string
  fields: FormField[]
  submitLabel?: string
  successMessage?: string
}

function isPreviewMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.bioPreview === '1'
}

/**
 * Corpo do formulário (embed ou modal) — envia para /api/public/forms/submit.
 */
export function BioFormFields({
  definition,
  sectionId,
  itemIndex,
  onSubmitted,
}: {
  definition: ResolvedFormDefinition
  sectionId?: string
  itemIndex?: number
  onSubmitted?: () => void
}) {
  const fields = definition.fields ?? []
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.id, ''])),
  )
  const [honeypot, setHoneypot] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValues(Object.fromEntries(fields.map((field) => [field.id, ''])))
    setSent(false)
    setError(null)
  }, [definition.slug, fields])

  function updateField(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }))
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    for (const field of fields) {
      if (field.required && !(values[field.id] ?? '').trim()) {
        setError(`Preencha o campo "${field.label}".`)
        return
      }
    }

    if (isPreviewMode()) {
      setSent(true)
      onSubmitted?.()
      return
    }

    const analyticsKey = getAnalyticsKey()
    if (!analyticsKey) {
      setError('Não foi possível enviar agora. Tente de novo em instantes.')
      return
    }

    setSending(true)
    setError(null)
    try {
      const response = await fetch('/api/public/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          analytics_key: analyticsKey,
          form_slug: definition.slug || undefined,
          section_id: sectionId ?? '',
          item_index: itemIndex ?? 0,
          form_title: definition.title?.trim() || null,
          answers: values,
          visitor_id: getVisitorId(),
          website: honeypot,
        }),
      })
      if (!response.ok) throw new Error('Falha no envio')
      setSent(true)
      onSubmitted?.()
    } catch {
      setError('Não foi possível enviar. Verifique a conexão e tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <p className="text-sm font-medium text-foreground">
        {definition.successMessage?.trim() || 'Recebemos sua mensagem. Obrigado!'}
      </p>
    )
  }

  return (
    <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)} noValidate>
      {definition.title?.trim() && (
        <h3 className="text-sm font-bold leading-tight text-foreground">{definition.title.trim()}</h3>
      )}
      {definition.description?.trim() && (
        <p className="text-xs leading-relaxed text-muted-foreground">{definition.description.trim()}</p>
      )}

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">Este formulário ainda não tem campos.</p>
      ) : (
        fields.map((field) => (
          <label key={field.id} className="block min-w-0">
            <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            {field.type === 'textarea' ? (
              <textarea
                className="bio-form-input min-h-[5rem] w-full resize-y"
                value={values[field.id] ?? ''}
                placeholder={field.placeholder}
                required={field.required}
                disabled={sending}
                onChange={(e) => updateField(field.id, e.target.value)}
              />
            ) : (
              <input
                className="bio-form-input w-full"
                type={field.type === 'phone' ? 'tel' : field.type}
                value={values[field.id] ?? ''}
                placeholder={field.placeholder}
                required={field.required}
                disabled={sending}
                autoComplete={
                  field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'on'
                }
                onChange={(e) => updateField(field.id, e.target.value)}
              />
            )}
          </label>
        ))
      )}

      {error && <p className="text-[11px] text-amber-600 dark:text-amber-400">{error}</p>}

      <button type="submit" className="bio-form-submit w-full" disabled={fields.length === 0 || sending}>
        {sending ? 'Enviando…' : definition.submitLabel?.trim() || 'Enviar'}
      </button>
    </form>
  )
}

/**
 * Modal de formulário na bio pública.
 */
export function FormModal({
  open,
  definition,
  sectionId,
  itemIndex,
  onClose,
}: {
  open: boolean
  definition: ResolvedFormDefinition | null
  sectionId?: string
  itemIndex?: number
  onClose: () => void
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !definition || typeof document === 'undefined') return null

  return createPortal(
    <div className="bio-form-modal-root" role="presentation">
      <button type="button" className="bio-form-modal-backdrop" aria-label="Fechar" onClick={onClose} />
      <div
        className="bio-form-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <p id={titleId} className="sr-only">
            {definition.title || 'Formulário'}
          </p>
          <button
            type="button"
            className="ml-auto rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Fechar formulário"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <BioFormFields definition={definition} sectionId={sectionId} itemIndex={itemIndex} />
      </div>
    </div>,
    document.body,
  )
}

export async function fetchPublishedForm(formSlug: string): Promise<ResolvedFormDefinition | null> {
  const analyticsKey = getAnalyticsKey()
  if (!analyticsKey || !formSlug.trim()) return null
  const params = new URLSearchParams({ analytics_key: analyticsKey })
  const response = await fetch(
    `/api/public/forms/${encodeURIComponent(formSlug.trim())}?${params}`,
    { headers: { Accept: 'application/json' } },
  )
  if (!response.ok) return null
  const data = (await response.json()) as ResolvedFormDefinition
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    fields: Array.isArray(data.fields) ? data.fields : [],
    submitLabel: data.submitLabel,
    successMessage: data.successMessage,
  }
}
