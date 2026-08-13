import type { ReactNode } from 'react'
import type { ProductItem } from '@bio-types'
import { ImageField } from './ImageField'

interface ProductsFieldProps {
  products: ProductItem[]
  onChange: (products: ProductItem[]) => void
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

export function ProductsField({ products, onChange }: ProductsFieldProps) {
  function updateProduct(index: number, patch: Partial<ProductItem>) {
    onChange(products.map((product, i) => (i === index ? { ...product, ...patch } : product)))
  }

  function removeProduct(index: number) {
    onChange(products.filter((_, i) => i !== index))
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= products.length) return
    const next = [...products]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  function addProduct() {
    onChange([
      ...products,
      { image: '', title: '', url: '', cta: 'Compre aqui' },
    ])
  }

  return (
    <div className="field">
      <label>Produtos da galeria</label>
      <div className="space-y-3">
        {products.length === 0 && (
          <p className="text-xs text-muted-foreground/70">Nenhum produto ainda.</p>
        )}
        {products.map((product, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Produto {index + 1}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs"
                  disabled={index === 0}
                  onClick={() => moveProduct(index, -1)}
                  aria-label="Mover produto para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs"
                  disabled={index === products.length - 1}
                  onClick={() => moveProduct(index, 1)}
                  aria-label="Mover produto para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-danger px-2 py-1 text-xs"
                  onClick={() => removeProduct(index)}
                >
                  Remover
                </button>
              </div>
            </div>

            <ImageField
              label="Imagem"
              value={product.image}
              onChange={(image) => updateProduct(index, { image: image ?? '' })}
            />
            <Field label="Nome (opcional)">
              <input
                value={product.title ?? ''}
                onChange={(e) => updateProduct(index, { title: e.target.value })}
                placeholder="Nome do produto"
              />
            </Field>
            <Field label="Link do CTA (opcional)">
              <input
                value={product.url ?? ''}
                onChange={(e) => updateProduct(index, { url: e.target.value || undefined })}
                placeholder="https://"
              />
            </Field>
            <Field label="Texto do botão">
              <input
                value={product.cta ?? 'Compre aqui'}
                onChange={(e) => updateProduct(index, { cta: e.target.value })}
                placeholder="Compre aqui"
              />
            </Field>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary mt-2 w-full py-1.5 text-xs" onClick={addProduct}>
        + Adicionar produto
      </button>
    </div>
  )
}
