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
          {(item.variant === 'banner') && (
            <Field label="Tags (JSON)">
              <textarea
                rows={3}
                value={JSON.stringify(item.tags ?? [], null, 2)}
                onChange={(e) => {
                  try {
                    const tags = JSON.parse(e.target.value)
                    onChange({ ...item, tags })
                  } catch {
                    // ignore invalid JSON while typing
                  }
                }}
                placeholder='[{"label":"Kids","icon":"baby"}]'
              />
            </Field>
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
