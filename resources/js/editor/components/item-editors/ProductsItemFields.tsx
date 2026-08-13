import type { ProductsCard } from '@bio-types'
import { ProductsField } from '../ProductsField'
import { Field } from './Field'

export function ProductsItemFields({
  item,
  onChange,
}: {
  item: ProductsCard
  onChange: (item: ProductsCard) => void
}) {
  return (
    <>
      <Field label="Título da galeria (opcional)">
        <input
          value={item.title ?? ''}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
          placeholder="Ex.: Nossa loja"
        />
      </Field>
      <ProductsField
        products={item.products}
        onChange={(products) => onChange({ ...item, products })}
      />
    </>
  )
}
