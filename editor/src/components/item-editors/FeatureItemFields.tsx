import type { FeatureCard } from '@bio-types'
import { resolveAccentColor } from '@site/lib/accentTheme'
import { FEATURE_ALIGNS, FEATURE_VARIANTS } from '../../lib/bio'
import { AccentColorField } from '../AccentColorField'
import { IconPicker } from '../IconPicker'
import { ImageField } from '../ImageField'
import { CardWidthField } from './CardWidthField'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'
import { TagsField } from './TagsField'
import { withOptionalIcon } from './withOptionalIcon'

export function FeatureItemFields({
  item,
  isGridSection,
  onChange,
}: {
  item: FeatureCard
  isGridSection: boolean
  onChange: (item: FeatureCard) => void
}) {
  return (
    <>
      <FieldGroup title="Layout">
        <Field label="Formato">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {FEATURE_VARIANTS.map((variant) => {
              const selected = (item.variant ?? 'gradient') === variant.value
              return (
                <button
                  key={variant.value}
                  type="button"
                  className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 font-semibold text-foreground'
                      : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                  }`}
                  onClick={() =>
                    onChange({
                      ...item,
                      variant: variant.value as typeof item.variant,
                    })
                  }
                >
                  {variant.label}
                </button>
              )
            })}
          </div>
        </Field>
        {(item.variant ?? 'gradient') === 'gradient' && (
          <Field label="Alinhamento">
            <div className="grid grid-cols-2 gap-1.5">
              {FEATURE_ALIGNS.map((option) => {
                const selected = (item.align ?? 'side') === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10 font-semibold text-foreground'
                        : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                    }`}
                    onClick={() =>
                      onChange({
                        ...item,
                        align: option.value,
                      })
                    }
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </Field>
        )}
        <CardWidthField
          value={item.width}
          isGridSection={isGridSection}
          onChange={(width) => onChange({ ...item, width })}
        />
      </FieldGroup>

      <FieldGroup title="Conteúdo">
        <Field label="Badge">
          <input
            value={item.badge ?? ''}
            onChange={(e) => onChange({ ...item, badge: e.target.value })}
          />
        </Field>
        <Field label="Título">
          <input
            value={item.title}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
          />
        </Field>
        <Field label="Descrição">
          <textarea
            rows={2}
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
        </Field>
        <Field label="Texto do botão">
          <input
            value={item.cta ?? ''}
            onChange={(e) => onChange({ ...item, cta: e.target.value })}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Visual">
        <AccentColorField
          value={resolveAccentColor(item.accentColor, item.gradient)}
          onChange={(accentColor) =>
            onChange({
              ...item,
              accentColor,
              gradient: accentColor ? undefined : item.gradient,
            })
          }
        />
        <IconPicker
          value={item.icon}
          onChange={(icon) => onChange(withOptionalIcon(item, icon))}
        />
        <ImageField
          label="Imagem (retrato / banner)"
          value={item.image}
          onChange={(image) => onChange({ ...item, image })}
        />
        {['banner', 'portrait'].includes(item.variant ?? '') && (
          <TagsField
            value={item.tags ?? []}
            onChange={(tags) => onChange({ ...item, tags })}
          />
        )}
      </FieldGroup>
    </>
  )
}
