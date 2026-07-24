import type { GridCard } from '@bio-types'
import { resolveAccentColor } from '@site/lib/accentTheme'
import { AccentColorField } from '../AccentColorField'
import { ImageField } from '../ImageField'
import { Field } from './Field'

export function GridItemFields({
  item,
  onChange,
}: {
  item: GridCard
  onChange: (item: GridCard) => void
}) {
  return (
    <>
      <Field label="Badge">
        <input
          value={item.badge ?? ''}
          onChange={(e) => onChange({ ...item, badge: e.target.value })}
        />
      </Field>
      <Field label="Título">
        <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
      </Field>
      <Field label="Subtítulo">
        <input
          value={item.subtitle ?? ''}
          onChange={(e) => onChange({ ...item, subtitle: e.target.value })}
        />
      </Field>
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
      <ImageField
        label="Imagem"
        value={item.image}
        onChange={(image) => onChange({ ...item, image })}
      />
    </>
  )
}
