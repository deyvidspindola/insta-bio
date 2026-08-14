import { useEffect, useState } from 'react'
import type { FormCard, FormDisplayMode } from '@bio-types'
import { api } from '../../../shared/http'
import { ENDPOINTS } from '../../lib/endpoints'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

type BioFormOption = {
  slug: string
  title: string
  status: string
}

/**
 * No conteúdo da bio: escolhe formulário do menu Formulários + modo embed/modal.
 */
export function FormItemFields({
  item,
  onChange,
}: {
  item: FormCard
  onChange: (item: FormCard) => void
}) {
  const [forms, setForms] = useState<BioFormOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<{ forms: BioFormOption[] }>(ENDPOINTS.bioForms)
      .then((data) => {
        if (!cancelled) setForms(data.forms ?? [])
      })
      .catch(() => {
        if (!cancelled) setForms([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const display: FormDisplayMode = item.display === 'modal' ? 'modal' : 'embed'
  const selected = forms.find((form) => form.slug === item.formSlug)

  return (
    <>
      <FieldGroup title="Formulário">
        <Field label="Qual formulário">
          <select
            value={item.formSlug ?? ''}
            disabled={loading}
            onChange={(e) =>
              onChange({
                ...item,
                formSlug: e.target.value,
                title: forms.find((f) => f.slug === e.target.value)?.title ?? item.title,
                fields: [],
              })
            }
          >
            <option value="">{loading ? 'Carregando…' : 'Selecione um formulário'}</option>
            {forms.map((form) => (
              <option key={form.slug} value={form.slug}>
                {form.title}
                {form.status !== 'published' ? ' (rascunho)' : ''}
              </option>
            ))}
          </select>
          {!loading && forms.length === 0 && (
            <p className="mt-1.5 text-[11px] leading-snug text-amber-600 dark:text-amber-400">
              Nenhum formulário ainda. Crie um na aba Formulários do menu.
            </p>
          )}
          {selected && selected.status !== 'published' && (
            <p className="mt-1.5 text-[11px] leading-snug text-amber-600 dark:text-amber-400">
              Publique este formulário na aba Formulários para aparecer na bio pública.
            </p>
          )}
        </Field>

        <Field label="Exibição">
          <select
            value={display}
            onChange={(e) =>
              onChange({ ...item, display: e.target.value as FormDisplayMode })
            }
          >
            <option value="embed">Embutido na bio</option>
            <option value="modal">Botão que abre em modal</option>
          </select>
        </Field>

        {display === 'modal' && (
          <Field label="Texto do botão">
            <input
              value={item.buttonLabel ?? ''}
              onChange={(e) => onChange({ ...item, buttonLabel: e.target.value })}
              placeholder="Abrir formulário"
            />
          </Field>
        )}

        <Field label="Descrição no card (opcional)">
          <textarea
            rows={2}
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
            placeholder="Texto curto abaixo do botão (só no modo modal)"
          />
        </Field>
      </FieldGroup>
    </>
  )
}
