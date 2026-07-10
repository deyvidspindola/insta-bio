import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import type { BioConfig } from '../types/bio'
import { resolveBackgroundPreset } from '../lib/backgroundPresets'
import { resolvePrimarySurfaceColors } from '../lib/contrastColor'
import { resolveBioTemplate } from '../lib/templates'
import { resolveCardRadiusPx } from '../lib/cardRadius'
import { applyPageMeta } from '../lib/pageMeta'
import { resolvePublicUrl } from '../lib/publicUrl'
import { BioHeader } from './BioHeader'
import { BioSectionBlock } from './BioSection'

interface BioPageProps {
  config: BioConfig
  /** Destaque do card ativo no preview do editor (opcional). */
  previewFocus?: { sectionId: string; itemIndex: number } | null
}

export function BioPage({ config, previewFocus = null }: BioPageProps) {
  const { brand, sections } = config
  const template = resolveBioTemplate(brand.template)
  const bgPreset = resolveBackgroundPreset(brand.theme.backgroundPreset)
  const hasBgImage = Boolean(brand.theme.backgroundImage)
  const hasBgPreset = Boolean(bgPreset) && !hasBgImage

  const primarySurface = resolvePrimarySurfaceColors(brand.theme.primary)

  const themeVars = {
    '--color-primary': brand.theme.primary,
    '--bio-solid-from': primarySurface.solidFrom,
    '--bio-solid-to': primarySurface.solidTo,
    '--bio-fill-primary': primarySurface.fillPrimary,
    '--bio-card-radius': resolveCardRadiusPx(brand.theme.cardRadius),
    ...(brand.theme.secondary ? { '--color-secondary': brand.theme.secondary } : {}),
    ...(!hasBgImage && (hasBgPreset ? bgPreset?.edgeColor : brand.theme.background)
      ? {
          '--color-background': hasBgPreset
            ? bgPreset!.edgeColor
            : brand.theme.background,
        }
      : {}),
  } as CSSProperties

  useEffect(() => {
    applyPageMeta(brand)
  }, [brand.logo, brand.name, brand.tagline])

  useEffect(() => {
    const root = document.documentElement
    const keys = Object.keys(themeVars) as Array<keyof typeof themeVars>

    keys.forEach((key) => {
      const value = themeVars[key]
      if (value != null && value !== '') {
        root.style.setProperty(key, String(value))
      }
    })
  }, [
    brand.theme.primary,
    brand.theme.secondary,
    brand.theme.background,
    brand.theme.cardRadius,
    brand.theme.backgroundPreset,
    brand.theme.backgroundImage,
    primarySurface.solidFrom,
    primarySurface.solidTo,
    primarySurface.fillPrimary,
  ])

  return (
    <div
      data-bio-template={template}
      className="relative isolate min-h-screen text-foreground"
      style={themeVars}
    >
      {!hasBgImage && !hasBgPreset && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-background" />
      )}

      {hasBgPreset && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: bgPreset!.gradient }}
        />
      )}

      {hasBgImage && (
        <div
          aria-hidden="true"
          className="bio-page-bg-image pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${resolvePublicUrl(brand.theme.backgroundImage!)})`,
          }}
        />
      )}

      {hasBgImage && (
        <div
          aria-hidden="true"
          className="bio-page-bg-overlay bio-page-bg-overlay--image pointer-events-none fixed inset-0 z-[1]"
        />
      )}

      {!hasBgImage && !hasBgPreset && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[1] h-[480px]"
          style={{
            background: `radial-gradient(60% 60% at 50% 0%, ${brand.theme.glow ?? brand.theme.primary}, transparent 70%)`,
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-md px-5 pb-16 pt-12 sm:max-w-lg sm:px-6 sm:pt-16">
        <BioHeader brand={brand} />

        {sections.map((section) => (
          <BioSectionBlock
            key={section.id}
            section={section}
            focusItemIndex={
              previewFocus?.sectionId === section.id ? previewFocus.itemIndex : null
            }
          />
        ))}

        <footer className="mt-10 text-center space-y-1.5">
          <p className="text-[11px] text-muted-foreground/70">{brand.footer}</p>
          <p className="text-[11px] text-muted-foreground/80">
            by{' '}
            <a
              href="https://linksnabio.app.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
            >
              linksnabio
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
