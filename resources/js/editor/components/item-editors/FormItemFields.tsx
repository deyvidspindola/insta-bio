import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { FormCard, FormField, FormFieldType } from '@bio-types'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'textarea', label: 'Texto longo' },
]

function newField(): FormField {
  return {
    id: `campo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'text',
    label: 'Novo campo',
    required: false,
  }
}

export function FormItemFields({
  item,
  onChange,
}: {
  item: FormCard
  onChange: (item: FormCard) => void
}) {
  const fields = item.fields ?? []

  function patchField(index: number, patch: Partial<FormField>) {
    const next = fields.map((field, i) => (i === index ? { ...field, ...patch } : field))
    onChange({ ...item, fields: next })
  }

  function moveField(from: number, to: number) {
    if (to < 0 || to >= fields.length) return
    const next = [...fields]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange({ ...item, fields: next })
  }

  return (
    <>
      <FieldGroup title="Formulário">
        <Field label="Título">
          <input
            value={item.title ?? ''}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Ex.: Fale conosco"
          />
        </Field>
        <Field label="Descrição (opcional)">
          <textarea
            rows={2}
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
            placeholder="Texto curto acima dos campos"
          />
        </Field>
        <Field label="Texto do botão">
          <input
            value={item.submitLabel ?? ''}
            onChange={(e) => onChange({ ...item, submitLabel: e.target.value })}
            placeholder="Enviar"
          />
        </Field>
        <Field label="Mensagem de sucesso">
          <input
            value={item.successMessage ?? ''}
            onChange={(e) => onChange({ ...item, successMessage: e.target.value })}
            placeholder="Recebemos sua mensagem. Obrigado!"
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Campos">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-2 rounded-lg border border-border/70 bg-background/30 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Campo {index + 1}
                </p>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="btn-ghost p-1.5"
                    disabled={index === 0}
                    aria-label="Mover campo para cima"
                    onClick={() => moveField(index, index - 1)}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost p-1.5"
                    disabled={index === fields.length - 1}
                    aria-label="Mover campo para baixo"
                    onClick={() => moveField(index, index + 1)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost p-1.5 text-muted-foreground hover:text-red-400"
                    aria-label="Remover campo"
                    onClick={() =>
                      onChange({
                        ...item,
                        fields: fields.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Field label="Rótulo">
                <input
                  value={field.label}
                  onChange={(e) => patchField(index, { label: e.target.value })}
                />
              </Field>
              <Field label="Tipo">
                <select
                  value={field.type}
                  onChange={(e) =>
                    patchField(index, { type: e.target.value as FormFieldType })
                  }
                >
                  {FIELD_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Placeholder (opcional)">
                <input
                  value={field.placeholder ?? ''}
                  onChange={(e) => patchField(index, { placeholder: e.target.value })}
                />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(field.required)}
                  onChange={(e) => patchField(index, { required: e.target.checked })}
                />
                Obrigatório
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary mt-2 flex w-full items-center justify-center gap-1.5 py-1.5 text-xs"
          onClick={() => onChange({ ...item, fields: [...fields, newField()] })}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar campo
        </button>
      </FieldGroup>
    </>
  )
}
