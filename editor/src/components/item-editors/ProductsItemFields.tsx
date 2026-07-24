import type { ProductsCard } from '@bio-types'
import { AccentColorField } from '../AccentColorField'
import { ProductsField } from '../ProductsField'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

export function ProductsItemFields({
  item,
  onChange,
}: {
  item: ProductsCard
  onChange: (item: ProductsCard) => void
}) {
  return (
    <>
      <FieldGroup title="Galeria">
        <Field label="Título da galeria (opcional)">
          <input
            value={item.title ?? ''}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Ex.: Nossa loja"
          />
        </Field>
        <AccentColorField
          value={item.accentColor}
          onChange={(accentColor) => onChange({ ...item, accentColor })}
        />
        <ProductsField
          products={item.products}
          onChange={(products) => onChange({ ...item, products })}
        />
      </FieldGroup>
    </>
  )
}
