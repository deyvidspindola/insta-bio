import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import type { BioConfig } from '../types/bio'
import { BioHeader } from './BioHeader'
import { BioSectionBlock } from './BioSection'

interface BioPageProps {
  config: BioConfig
}

export function BioPage({ config }: BioPageProps) {
  const { brand, sections } = config

  useEffect(() => {
    document.title = brand.seo.title

    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.setAttribute('content', brand.seo.description)
    }
  }, [brand.seo.description, brand.seo.title])

  const themeVars = {
    '--color-primary': brand.theme.primary,
  } as CSSProperties

  return (
    <div className="min-h-screen bg-background text-foreground" style={themeVars}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[480px]"
        style={{
          background: `radial-gradient(60% 60% at 50% 0%, ${brand.theme.glow ?? brand.theme.primary}, transparent 70%)`,
        }}
      />

      <div className="relative mx-auto max-w-md px-5 pb-16 pt-12 sm:max-w-lg sm:px-6 sm:pt-16">
        <BioHeader brand={brand} />

        {sections.map((section) => (
          <BioSectionBlock key={section.id} section={section} />
        ))}

        <footer className="mt-10 text-center">
          <p className="text-[11px] text-muted-foreground/70">{brand.footer}</p>
        </footer>
      </div>
    </div>
  )
}
