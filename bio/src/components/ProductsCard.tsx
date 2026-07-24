import { useState } from 'react'
import type { ProductItem, ProductsCard as ProductsCardType } from '../types/bio'
import { ImageLightbox } from './ImageLightbox'
import { CardCoverImage } from './CardCoverImage'

function ProductThumb({
  product,
  onOpen,
}: {
  product: ProductItem
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      className="bio-product-thumb group relative aspect-square w-full overflow-hidden"
      onClick={onOpen}
      aria-label={product.title ? `Ver ${product.title}` : 'Ver produto'}
    >
      <CardCoverImage
        src={product.image}
        alt={product.title ?? 'Produto'}
        fallbackSize="sm"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {product.title && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2 pt-6 text-left text-[11px] font-medium leading-tight text-white">
          {product.title}
        </span>
      )}
    </button>
  )
}

export function ProductsCard({
  item,
  pageBackground = '#000000',
}: {
  item: ProductsCardType
  pageBackground?: string
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  // Mantém itens com campo image (mesmo URL quebrada) — o fallback visual cobre o erro.
  const products = item.products.filter((product) => product.image?.trim())

  if (products.length === 0) {
    return (
      <div className="bio-card bio-card--media bio-products-card relative block w-full p-6 text-center">
        <p className="text-sm opacity-70">Adicione produtos no editor</p>
      </div>
    )
  }

  return (
    <>
      <div className="bio-card bio-card--media bio-products-card relative block w-full">
        {item.title && (
          <h3 className="bio-products-title mb-3 px-1 text-sm font-semibold">{item.title}</h3>
        )}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {products.map((product, index) => (
            <ProductThumb
              key={`${product.image}-${index}`}
              product={product}
              onOpen={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      {activeIndex !== null && (
        <ImageLightbox
          products={products}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
          accentColor={item.accentColor}
          pageBackground={pageBackground}
        />
      )}
    </>
  )
}
