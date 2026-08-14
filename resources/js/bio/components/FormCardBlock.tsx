import { useState, type FormEvent } from 'react'
import type { FormCard as FormCardType } from '../types/bio'
import { getAnalyticsKey, getVisitorId } from '../lib/analytics'

function isPreviewMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.bioPreview === '1'
}

/**
 * Formulário da bio — envia respostas para /api/public/forms/submit.
 */
export function FormCardBlock({
  item,
  sectionId,
  itemIndex,
}: {
  item: FormCardType
  sectionId: string
  itemIndex: number
}) {
  const fields = item.fields ?? []
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.id, ''])),
  )
  const [honeypot, setHoneypot] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          section_id: sectionId,
          item_index: itemIndex,
          form_title: item.title?.trim() || null,
          answers: values,
          visitor_id: getVisitorId(),
          website: honeypot,
        }),
      })
      if (!response.ok) {
        throw new Error('Falha no envio')
      }
      setSent(true)
    } catch {
      setError('Não foi possível enviar. Verifique a conexão e tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bio-card bio-form-card px-4 py-5">
        <p className="text-sm font-medium text-foreground">
          {item.successMessage?.trim() || 'Recebemos sua mensagem. Obrigado!'}
        </p>
      </div>
    )
  }

  return (
    <form className="bio-card bio-form-card space-y-3 px-4 py-4" onSubmit={(e) => void handleSubmit(e)} noValidate>
      {item.title?.trim() && (
        <h3 className="text-sm font-bold leading-tight text-foreground">{item.title.trim()}</h3>
      )}
      {item.description?.trim() && (
        <p className="text-xs leading-relaxed text-muted-foreground">{item.description.trim()}</p>
      )}

      {/* Honeypot — oculto para humanos */}
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
        <p className="text-xs text-muted-foreground">Adicione campos no editor para este formulário.</p>
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

      <button
        type="submit"
        className="bio-form-submit w-full"
        disabled={fields.length === 0 || sending}
      >
        {sending ? 'Enviando…' : item.submitLabel?.trim() || 'Enviar'}
      </button>
    </form>
  )
}
