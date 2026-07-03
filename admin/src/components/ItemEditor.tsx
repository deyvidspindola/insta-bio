import type { ReactNode } from 'react'
import type { IconName, SectionItem } from '@bio-types'
import { CARD_TYPES, FEATURE_VARIANTS, ICON_OPTIONS } from '../lib/bio'
import { GradientField } from './GradientField'
import { ImageField } from './ImageField'

interface ItemEditorProps {
  item: SectionItem
  onChange: (item: SectionItem) => void
  onRemove: () => void
  dragHandle?: ReactNode
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function IconSelect({
  value,
  onChange,
}: {
  value?: IconName
  onChange: (value?: IconName) => void
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value as IconName) || undefined)}
    >
      <option value="">Sem ícone</option>
      {ICON_OPTIONS.map((icon) => (
        <option key={icon} value={icon}>
          {icon}
        </option>
      ))}
    </select>
  )
}

type Tag = { label: string; icon?: IconName }

function TagsField({
  value,
  onChange,
}: {
  value: Tag[]
  onChange: (tags: Tag[]) => void
}) {
  function updateTag(index: number, patch: Partial<Tag>) {
    const next = value.map((tag, i) => (i === index ? { ...tag, ...patch } : tag))
    onChange(next)
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addTag() {
    onChange([...value, { label: '' }])
  }

  return (
    <div className="field">
      <label>Tags</label>
      <div className="space-y-2">
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground/70">Nenhuma tag ainda.</p>
        )}
        {value.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2"
          >
            <input
              className="min-w-0 flex-1"
              value={tag.label}
              placeholder="Texto da tag"
              onChange={(e) => updateTag(index, { label: e.target.value })}
            />
            <div className="w-32 shrink-0 sm:w-40">
              <IconSelect
                value={tag.icon}
                onChange={(icon) => updateTag(index, { icon })}
              />
            </div>
            <button
              type="button"
              className="btn-ghost shrink-0 px-2 py-1 text-xs"
              onClick={() => removeTag(index)}
              title="Remover tag"
              aria-label="Remover tag"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-secondary mt-2 w-full py-1.5 text-xs"
        onClick={addTag}
      >
        + Adicionar tag
      </button>
    </div>
  )
}

export function ItemEditor({
  item,
  onChange,
  onRemove,
  dragHandle,
  collapsed = false,
  onToggleCollapse,
}: ItemEditorProps) {
  const typeLabel = CARD_TYPES.find((t) => t.value === item.type)?.label ?? item.type

  return (
    <div className={`card ${collapsed ? '' : 'space-y-3'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {dragHandle}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              title={collapsed ? 'Expandir' : 'Recolher'}
              aria-expanded={!collapsed}
            >
              <span className="inline-block w-4 text-center text-xs">{collapsed ? '▸' : '▾'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="min-w-0 text-left"
            disabled={!onToggleCollapse}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{typeLabel}</p>
            <p className="truncate font-medium">{'title' in item ? item.title : item.type}</p>
          </button>
        </div>
        <button
          type="button"
          className="btn-danger shrink-0 px-3 py-1.5 text-xs"
          onClick={onRemove}
        >
          Remover
        </button>
      </div>

      {collapsed ? null : (
        <>
      {'url' in item && (
        <Field label="URL">
          <input
            value={item.url}
            onChange={(e) => onChange({ ...item, url: e.target.value } as SectionItem)}
          />
        </Field>
      )}

      {item.type === 'whatsapp-hero' && (
        <>
          <Field label="Badge">
            <input value={item.badge} onChange={(e) => onChange({ ...item, badge: e.target.value })} />
          </Field>
          <Field label="Título">
            <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <textarea rows={2} value={item.description} onChange={(e) => onChange({ ...item, description: e.target.value })} />
          </Field>
          <Field label="Texto do botão">
            <input value={item.cta} onChange={(e) => onChange({ ...item, cta: e.target.value })} />
          </Field>
        </>
      )}

      {item.type === 'feature' && (
        <>
          <Field label="Variante">
            <select
              value={item.variant ?? 'gradient'}
              onChange={(e) =>
                onChange({
                  ...item,
                  variant: e.target.value as typeof item.variant,
                })
              }
            >
              {FEATURE_VARIANTS.map((variant) => (
                <option key={variant.value} value={variant.value}>
                  {variant.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Badge">
            <input value={item.badge ?? ''} onChange={(e) => onChange({ ...item, badge: e.target.value })} />
          </Field>
          <Field label="Título">
            <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <textarea rows={2} value={item.description ?? ''} onChange={(e) => onChange({ ...item, description: e.target.value })} />
          </Field>
          <Field label="CTA (botão)">
            <input value={item.cta ?? ''} onChange={(e) => onChange({ ...item, cta: e.target.value })} />
          </Field>
          <Field label="Ícone">
            <IconSelect value={item.icon} onChange={(icon) => onChange({ ...item, icon })} />
          </Field>
          <ImageField
            label="Imagem (portrait/banner)"
            value={item.image}
            onChange={(image) => onChange({ ...item, image })}
          />
          {['gradient', 'square'].includes(item.variant ?? 'gradient') && (
            <GradientField
              label="Cor do card (usada sem imagem)"
              value={item.gradient}
              onChange={(gradient) => onChange({ ...item, gradient })}
            />
          )}
          {['banner', 'portrait'].includes(item.variant ?? '') && (
            <TagsField
              value={item.tags ?? []}
              onChange={(tags) => onChange({ ...item, tags })}
            />
          )}
        </>
      )}

      {item.type === 'link' && (
        <>
          <Field label="Título">
            <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <input value={item.subtitle ?? ''} onChange={(e) => onChange({ ...item, subtitle: e.target.value })} />
          </Field>
          <Field label="Ícone">
            <IconSelect value={item.icon} onChange={(icon) => onChange({ ...item, icon })} />
          </Field>
        </>
      )}

      {item.type === 'grid' && (
        <>
          <Field label="Badge">
            <input value={item.badge ?? ''} onChange={(e) => onChange({ ...item, badge: e.target.value })} />
          </Field>
          <Field label="Título">
            <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <input value={item.subtitle ?? ''} onChange={(e) => onChange({ ...item, subtitle: e.target.value })} />
          </Field>
          <ImageField
            label="Imagem"
            value={item.image}
            onChange={(image) => onChange({ ...item, image })}
          />
          <GradientField
            label="Cor do card (usada sem imagem)"
            value={item.gradient}
            onChange={(gradient) => onChange({ ...item, gradient })}
          />
        </>
      )}

      {item.type === 'location' && (
        <>
          <Field label="Título">
            <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
          </Field>
          <Field label="Endereço">
            <input value={item.address} onChange={(e) => onChange({ ...item, address: e.target.value })} />
          </Field>
          <Field label="URL do mapa">
            <input value={item.mapUrl} onChange={(e) => onChange({ ...item, mapUrl: e.target.value })} />
          </Field>
        </>
      )}
        </>
      )}
    </div>
  )
}
