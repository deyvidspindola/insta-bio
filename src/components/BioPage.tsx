import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import type { BioConfig } from '../types/bio'
import { resolveBackgroundPreset } from '../lib/backgroundPresets'
import { resolvePrimarySurfaceColors } from '../lib/contrastColor'
import { resolveBioTemplate } from '../lib/templates'
import { resolveCardRadiusPx } from '../lib/cardRadius'
import { resolvePublicUrl } from '../lib/publicUrl'
import { BioHeader } from './BioHeader'
import { BioSectionBlock } from './BioSection'

interface BioPageProps {
  config: BioConfig
}

export function BioPage({ config }: BioPageProps) {
  const { brand, sections } = config
  const template = resolveBioTemplate(brand.template)
  const bgPreset = resolveBackgroundPreset(brand.theme.backgroundPreset)
  const hasBgImage = Boolean(brand.theme.backgroundImage)
  const hasBgPreset = Boolean(bgPreset) && !hasBgImage

  useEffect(() => {
    document.title = brand.seo.title

    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.setAttribute('content', brand.seo.description)
    }
  }, [brand.seo.description, brand.seo.title])

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
          <BioSectionBlock key={section.id} section={section} />
        ))}

        <footer className="mt-10 text-center">
          <p className="text-[11px] text-muted-foreground/70">
            {brand.footer}
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            by{' '}
            <a
              href="https://linksnabio.app.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/80 underline-offset-2 transition-colors hover:text-primary hover:underline"
            >
              linksnabio
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
