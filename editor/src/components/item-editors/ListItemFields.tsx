import { Plus, Trash2 } from 'lucide-react'
import type { ListCard, ListStyle } from '@bio-types'
import { BackgroundFields } from './BackgroundFields'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

const LIST_STYLE_OPTIONS = [
  { value: 'number', label: 'Números', sample: '1.' },
  { value: 'bullet', label: 'Pontos', sample: '•' },
  { value: 'letter', label: 'Letras', sample: 'a.' },
  { value: 'plain', label: 'Simples', sample: '—' },
] as const

export function ListItemFields({
  item,
  onChange,
}: {
  item: ListCard
  onChange: (item: ListCard) => void
}) {
  return (
    <>
      <FieldGroup title="Conteúdo">
        <Field label="Título (opcional)">
          <input
            maxLength={80}
            value={item.title ?? ''}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
          />
        </Field>
        <Field label="Formato da lista">
          <div className="grid grid-cols-4 gap-1.5">
            {LIST_STYLE_OPTIONS.map(({ value, label, sample }) => {
              const selected = (item.style ?? 'bullet') === value
              return (
                <button
                  key={value}
                  type="button"
                  title={label}
                  aria-label={`Formato: ${label}`}
                  aria-pressed={selected}
                  className={`rounded-lg border px-1.5 py-2 text-center transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                  }`}
                  onClick={() => onChange({ ...item, style: value as ListStyle })}
                >
                  <span className="block text-sm font-bold leading-none">{sample}</span>
                  <span className="mt-1 block truncate text-[9px]">{label}</span>
                </button>
              )
            })}
          </div>
        </Field>

        <div className="field min-w-0">
          <label>Itens</label>
          <div className="space-y-2">
            {item.items.map((entry, index) => (
              <div key={index} className="flex min-w-0 items-center gap-2">
                <span className="w-5 shrink-0 text-right text-xs font-semibold text-primary">
                  {item.style === 'number'
                    ? `${index + 1}.`
                    : item.style === 'letter'
                      ? `${String.fromCharCode(97 + (index % 26))}.`
                      : item.style === 'plain'
                        ? '—'
                        : '•'}
                </span>
                <input
                  className="min-w-0 flex-1"
                  maxLength={160}
                  value={entry}
                  placeholder={`Item ${index + 1}`}
                  onChange={(e) => {
                    const items = [...item.items]
                    items[index] = e.target.value
                    onChange({ ...item, items })
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost shrink-0 p-2 text-muted-foreground hover:text-red-400"
                  aria-label={`Remover item ${index + 1}`}
                  title="Remover item"
                  onClick={() =>
                    onChange({
                      ...item,
                      items: item.items.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-secondary mt-2 flex w-full items-center justify-center gap-1.5 py-1.5 text-xs"
            onClick={() => onChange({ ...item, items: [...item.items, ''] })}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar item
          </button>
        </div>
      </FieldGroup>

      <BackgroundFields
        mode={item.backgroundMode}
        color={item.backgroundColor}
        opacity={item.backgroundOpacity}
        defaultMode="template"
        onChange={(patch) => onChange({ ...item, ...patch })}
      />
    </>
  )
}
