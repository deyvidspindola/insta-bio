import type { SlideCard } from '@bio-types'
import { MEDIA_CARD_VARIANTS } from '../../lib/bio'
import { SlidesField } from '../SlidesField'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

export function SlideItemFields({
  item,
  onChange,
}: {
  item: SlideCard
  onChange: (item: SlideCard) => void
}) {
  return (
    <>
      <FieldGroup title="Layout">
        <Field label="Formato">
          <select
            value={item.variant ?? 'portrait'}
            onChange={(e) =>
              onChange({
                ...item,
                variant: e.target.value as typeof item.variant,
              })
            }
          >
            {MEDIA_CARD_VARIANTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Avançar automaticamente">
          <select
            value={item.autoplay === false ? 'false' : 'true'}
            onChange={(e) => onChange({ ...item, autoplay: e.target.value === 'true' })}
          >
            <option value="true">Sim</option>
            <option value="false">Não — apenas ao tocar</option>
          </select>
        </Field>
      </FieldGroup>
      <FieldGroup title="Conteúdo">
        <Field label="Título do conjunto (opcional)">
          <input
            value={item.title ?? ''}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Ex.: Destaques"
          />
        </Field>
        <SlidesField slides={item.slides} onChange={(slides) => onChange({ ...item, slides })} />
      </FieldGroup>
    </>
  )
}
