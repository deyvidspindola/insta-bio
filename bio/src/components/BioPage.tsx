import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import type { BioConfig } from '../types/bio'
import { resolveBackgroundPreset } from '../lib/backgroundPresets'
import {
  contrastTextOn,
  extractGradientEndColor,
  resolveEffectiveBioBackground,
} from '../lib/colorEngine'
import { formatBioFooter } from '../lib/footer'
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
  const isGradientCustom =
    !hasBgImage && !hasBgPreset && Boolean(brand.theme.background?.includes('gradient'))
  const pageBackground = resolveEffectiveBioBackground({
    background: hasBgPreset && bgPreset ? bgPreset.gradient : brand.theme.background,
    backgroundPresetColor: bgPreset?.edgeColor,
    hasBackgroundImage: hasBgImage,
  })
  const footerColors = contrastTextOn(pageBackground)
  const footerText = formatBioFooter(brand.footer)

  // Cor para a variável CSS --color-background (cards, overlays)
  let bgColorForVars: string | undefined
  if (hasBgImage) {
    bgColorForVars = undefined
  } else if (hasBgPreset) {
    bgColorForVars = bgPreset!.edgeColor
  } else if (isGradientCustom) {
    const endColor = extractGradientEndColor(brand.theme.background)
    bgColorForVars = endColor
      ? `rgb(${Math.round(endColor.r)}, ${Math.round(endColor.g)}, ${Math.round(endColor.b)})`
      : '#000000'
  } else {
    bgColorForVars = brand.theme.background
  }

  const primarySurface = resolvePrimarySurfaceColors(brand.theme.primary)

  const themeVars = {
    '--color-primary': brand.theme.primary,
    '--bio-solid-from': primarySurface.solidFrom,
    '--bio-solid-to': primarySurface.solidTo,
    '--bio-fill-primary': primarySurface.fillPrimary,
    '--bio-card-radius': resolveCardRadiusPx(brand.theme.cardRadius),
    ...(brand.theme.secondary ? { '--color-secondary': brand.theme.secondary } : {}),
    ...(!hasBgImage && bgColorForVars
      ? {
          '--color-background': bgColorForVars,
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
      {!hasBgImage && !hasBgPreset && !isGradientCustom && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-background" />
      )}

      {hasBgPreset && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: bgPreset!.gradient }}
        />
      )}

      {isGradientCustom && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: brand.theme.background }}
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
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(0, 0, 0, ${(brand.theme.backgroundOverlayOpacity ?? 0.55) * 0.45}),
              rgba(0, 0, 0, ${brand.theme.backgroundOverlayOpacity ?? 0.55})
            )`,
          }}
        />
      )}

      {!hasBgImage && !hasBgPreset && !isGradientCustom && (
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
            pageBackground={pageBackground}
            focusItemIndex={
              previewFocus?.sectionId === section.id ? previewFocus.itemIndex : null
            }
          />
        ))}

        <footer className="mt-10 text-center space-y-1.5">
          <p className="text-[11px] font-medium" style={{ color: footerColors.body }}>
            {footerText}
          </p>
          <p className="text-[11px]" style={{ color: footerColors.muted }}>
            by{' '}
            <a
              href="https://linksnabio.app.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-2 transition-opacity hover:underline"
              style={{ color: footerColors.body }}
            >
              linksnabio
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
