import { useState, type FormEvent } from 'react'
import type { FormCard as FormCardType } from '../types/bio'

/**
 * Formulário da bio (estado local; submit real na fase de persistência).
 */
export function FormCardBlock({ item }: { item: FormCardType }) {
  const fields = item.fields ?? []
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.id, ''])),
  )
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }))
    setError(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    for (const field of fields) {
      if (field.required && !(values[field.id] ?? '').trim()) {
        setError(`Preencha o campo "${field.label}".`)
        return
      }
    }
    setError(null)
    setSent(true)
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
    <form className="bio-card bio-form-card space-y-3 px-4 py-4" onSubmit={handleSubmit} noValidate>
      {item.title?.trim() && (
        <h3 className="text-sm font-bold leading-tight text-foreground">{item.title.trim()}</h3>
      )}
      {item.description?.trim() && (
        <p className="text-xs leading-relaxed text-muted-foreground">{item.description.trim()}</p>
      )}

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
                onChange={(e) => updateField(field.id, e.target.value)}
              />
            ) : (
              <input
                className="bio-form-input w-full"
                type={field.type === 'phone' ? 'tel' : field.type}
                value={values[field.id] ?? ''}
                placeholder={field.placeholder}
                required={field.required}
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
        disabled={fields.length === 0}
      >
        {item.submitLabel?.trim() || 'Enviar'}
      </button>
    </form>
  )
}
