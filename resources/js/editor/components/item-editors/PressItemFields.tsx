import type { PressCard } from '@bio-types'
import { PRESS_DEFAULT_ACCENT } from '@site/lib/pressTheme'
import { APP_HERO_LAYOUTS, FEATURE_ALIGNS } from '../../lib/bio'
import { ImageField } from '../ImageField'
import { CardWidthField } from './CardWidthField'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

export function PressItemFields({
  item,
  isGridSection,
  onChange,
}: {
  item: PressCard
  isGridSection: boolean
  onChange: (item: PressCard) => void
}) {
  return (
    <>
      <FieldGroup title="Conteúdo">
        <Field label="Fonte / publicação">
          <input
            value={item.source}
            onChange={(e) => onChange({ ...item, source: e.target.value })}
            placeholder="Ex.: Folha de S.Paulo, Premio X…"
          />
        </Field>
        <Field label="Título da matéria">
          <input
            value={item.title}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Título da matéria ou reconhecimento"
          />
        </Field>
        <Field label="Resumo (opcional)">
          <textarea
            rows={2}
            value={item.description ?? ''}
            onChange={(e) =>
              onChange({
                ...item,
                description: e.target.value.trim() ? e.target.value : undefined,
              })
            }
            placeholder="Trecho curto opcional"
          />
        </Field>
        <Field label="Texto do botão">
          <input
            value={item.cta ?? ''}
            onChange={(e) =>
              onChange({
                ...item,
                cta: e.target.value.trim() ? e.target.value : undefined,
              })
            }
            placeholder="Ler matéria"
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Visual">
        <Field label="Cor de destaque">
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
              value={item.accentColor?.startsWith('#') ? item.accentColor : PRESS_DEFAULT_ACCENT}
              onChange={(e) => onChange({ ...item, accentColor: e.target.value })}
            />
            <input
              className="min-w-0 flex-1"
              value={item.accentColor ?? ''}
              onChange={(e) =>
                onChange({
                  ...item,
                  accentColor: e.target.value.trim() ? e.target.value : undefined,
                })
              }
              placeholder={PRESS_DEFAULT_ACCENT}
            />
          </div>
        </Field>
        <ImageField
          label="Imagem de fundo (opcional)"
          value={item.image}
          onChange={(image) => onChange({ ...item, image: image || undefined })}
        />
        {!isGridSection && (
          <Field label="Formato">
            <select
              value={item.layout ?? 'default'}
              onChange={(e) =>
                onChange({
                  ...item,
                  layout: e.target.value as PressCard['layout'],
                })
              }
            >
              {APP_HERO_LAYOUTS.map((layout) => (
                <option key={layout.value} value={layout.value}>
                  {layout.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Alinhamento">
          <select
            value={item.align ?? 'side'}
            onChange={(e) =>
              onChange({
                ...item,
                align: e.target.value as PressCard['align'],
              })
            }
          >
            {FEATURE_ALIGNS.map((align) => (
              <option key={align.value} value={align.value}>
                {align.label}
              </option>
            ))}
          </select>
        </Field>
        <CardWidthField
          value={item.width}
          isGridSection={isGridSection}
          onChange={(width) => onChange({ ...item, width })}
        />
      </FieldGroup>
    </>
  )
}
