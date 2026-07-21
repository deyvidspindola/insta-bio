import type { LocationCard } from '@bio-types'
import { Field } from './Field'

export function LocationItemFields({
  item,
  onChange,
}: {
  item: LocationCard
  onChange: (item: LocationCard) => void
}) {
  return (
    <>
      <Field label="Título">
        <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
      </Field>
      <Field label="Endereço">
        <input
          value={item.address}
          onChange={(e) => onChange({ ...item, address: e.target.value })}
        />
      </Field>
      <Field label="URL do mapa">
        <input
          value={item.mapUrl}
          onChange={(e) => onChange({ ...item, mapUrl: e.target.value })}
        />
      </Field>
    </>
  )
}
