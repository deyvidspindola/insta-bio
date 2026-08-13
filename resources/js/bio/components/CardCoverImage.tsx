import { useEffect, useState } from 'react'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { resolvePublicUrl } from '../lib/publicUrl'

/**
 * Só o fundo (gradiente/wash) quando a mídia falta ou falha.
 * Sem ícone decorativo — fundo limpo.
 */
export function CardMediaFallback({
  gradient,
  className = '',
}: {
  gradient?: string
  /** @deprecated Ignorado — fallback sem ícone. */
  icon?: unknown
  className?: string
  /** @deprecated Ignorado. */
  size?: 'sm' | 'md' | 'lg'
}) {
  const theme = APP_HERO_PRESETS.custom.theme

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{ background: gradient ?? theme.gradient }}
      aria-hidden="true"
    />
  )
}

/**
 * Capa de card: imagem quando carrega; sem imagem/erro → só o fundo colorido.
 */
export function CardCoverImage({
  src,
  alt,
  className,
  gradient,
  fallbackSize: _fallbackSize = 'md',
}: {
  src?: string
  alt: string
  className?: string
  gradient?: string
  /** @deprecated Fallback não exibe mais ícone. */
  icon?: unknown
  fallbackSize?: 'sm' | 'md' | 'lg'
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const trimmed = src?.trim()
  const showImage = Boolean(trimmed) && !failed

  if (!showImage) {
    return <CardMediaFallback gradient={gradient} />
  }

  return (
    <img
      src={resolvePublicUrl(trimmed!)}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
