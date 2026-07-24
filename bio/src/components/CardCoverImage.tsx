import { useEffect, useState } from 'react'
import type { IconName } from '../types/bio'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { resolvePublicUrl } from '../lib/publicUrl'
import { BioIcon } from './icons'

/**
 * Gradiente (ou wash) quando a mídia falta ou falha.
 * Ícone só aparece se `icon` for passado explicitamente — sem fallback sparkles.
 */
export function CardMediaFallback({
  gradient,
  icon,
  className = '',
  size = 'md',
}: {
  gradient?: string
  icon?: IconName
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const theme = APP_HERO_PRESETS.custom.theme

  const box =
    size === 'sm'
      ? 'h-10 w-10 rounded-xl'
      : size === 'lg'
        ? 'h-16 w-16 rounded-2xl'
        : 'h-14 w-14 rounded-2xl'
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-7 w-7'

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${className}`}
      style={{ background: gradient ?? theme.gradient }}
      aria-hidden="true"
    >
      {icon ? (
        <div
          className={`flex ${box} items-center justify-center ring-1`}
          style={{
            background: theme.iconBg,
            boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
          }}
        >
          <span style={{ color: theme.iconColor }}>
            <BioIcon name={icon} className={iconSize} />
          </span>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Capa de card: mostra a imagem quando carrega; se ausente ou onError,
 * troca por CardMediaFallback (só wash — ícone só se `icon` for informado).
 */
export function CardCoverImage({
  src,
  alt,
  className,
  gradient,
  icon,
  fallbackSize = 'md',
}: {
  src?: string
  alt: string
  className?: string
  gradient?: string
  icon?: IconName
  fallbackSize?: 'sm' | 'md' | 'lg'
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const trimmed = src?.trim()
  const showImage = Boolean(trimmed) && !failed

  if (!showImage) {
    return <CardMediaFallback gradient={gradient} icon={icon} size={fallbackSize} />
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
