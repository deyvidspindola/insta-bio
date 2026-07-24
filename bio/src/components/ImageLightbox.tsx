import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { resolvePublicUrl } from '../lib/publicUrl'
import { resolveAppHeroTheme } from '../lib/appHeroContrast'
import { buildAccentTheme } from '../lib/accentTheme'

export interface ImageLightboxProduct {
  image: string
  title?: string
  url?: string
  cta?: string
}

interface ImageLightboxProps {
  products: ImageLightboxProduct[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  /** Cor de destaque do CTA (substitui --color-primary neste lightbox). */
  accentColor?: string
  pageBackground?: string
}

export function ImageLightbox({
  products,
  index,
  onIndexChange,
  onClose,
  accentColor,
  pageBackground = '#000000',
}: ImageLightboxProps) {
  const product = products[index]
  const hasPrev = index > 0
  const hasNext = index < products.length - 1
  const theme = accentColor?.trim()
    ? resolveAppHeroTheme(buildAccentTheme(accentColor), pageBackground)
    : null

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(index - 1)
  }, [hasPrev, index, onIndexChange])

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(index + 1)
  }, [hasNext, index, onIndexChange])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [goNext, goPrev, onClose])

  if (!product) return null

  const ctaLabel = product.cta?.trim() || 'Compre aqui'
  const ctaStyle = theme
    ? {
        background: theme.ctaBg,
        color: theme.ctaText,
        boxShadow: theme.ctaShadow,
      }
    : undefined

  return createPortal(
    <div
      className="bio-lightbox fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-label={product.title ?? 'Visualizar produto'}
    >
      <button
        type="button"
        className="bio-lightbox-backdrop absolute inset-0"
        onClick={onClose}
        aria-label="Fechar visualização"
      />

      <div className="relative z-[1] flex min-h-full items-center justify-center py-6">
        <div className="bio-lightbox-shell relative mx-auto w-full max-w-md px-5 sm:max-w-lg sm:px-6">
          <button
            type="button"
            className="bio-lightbox-close absolute -top-1 right-5 z-[3] flex h-10 w-10 items-center justify-center rounded-full sm:right-6"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
            {products.length > 1 && (
              <button
                type="button"
                className="bio-lightbox-nav shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                disabled={!hasPrev}
                aria-label="Produto anterior"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
            )}

            <div className="bio-lightbox-content min-w-0 flex-1">
              <img
                src={resolvePublicUrl(product.image)}
                alt={product.title ?? 'Produto'}
                className="bio-lightbox-image w-full max-h-[78vh] object-contain shadow-2xl"
              />

              {(product.title || product.url) && (
                <div className="bio-lightbox-footer mt-4 space-y-3">
                  {product.title && (
                    <p className="text-center text-base font-semibold text-foreground">{product.title}</p>
                  )}
                  {product.url && (
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bio-lightbox-cta flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold"
                      style={ctaStyle}
                    >
                      {ctaLabel}
                    </a>
                  )}
                </div>
              )}
            </div>

            {products.length > 1 && (
              <button
                type="button"
                className="bio-lightbox-nav shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                disabled={!hasNext}
                aria-label="Próximo produto"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
