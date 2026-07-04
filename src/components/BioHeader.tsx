import type { BioBrand } from '../types/bio'
import { resolvePublicUrl } from '../lib/publicUrl'
import { InstagramIcon } from './icons'

interface BioHeaderProps {
  brand: BioBrand
}

export function BioHeader({ brand }: BioHeaderProps) {
  return (
    <header className="mb-10 flex animate-fade-up flex-col items-center text-center">
      {brand.coverImage && (
        <div className="bio-header-cover mb-6 w-full overflow-hidden rounded-3xl border border-border">
          <img
            src={resolvePublicUrl(brand.coverImage)}
            alt=""
            className="aspect-[21/9] w-full object-cover"
          />
        </div>
      )}

      <div className="relative w-full px-4">
        <div
          aria-hidden="true"
          className="absolute inset-x-8 -inset-y-6 rounded-full opacity-50 blur-3xl"
          style={{
            background: `radial-gradient(ellipse at center, ${brand.theme.glow ?? brand.theme.primary}, transparent 70%)`,
          }}
        />
        <img
          src={resolvePublicUrl(brand.logo)}
          alt={brand.name}
          className="relative mx-auto h-24 w-24 rounded-2xl object-cover shadow-[0_4px_24px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
        />
      </div>

      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">{brand.name}</h1>

      {brand.tagline && (
        <p className="bio-text-secondary mt-2 max-w-xs text-sm">{brand.tagline}</p>
      )}

      <p className="bio-text-secondary mt-4 text-xs font-medium uppercase tracking-[0.28em]">
        {brand.location}
      </p>

      <a
        href={brand.instagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className="bio-header-instagram mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-foreground/85 backdrop-blur-md transition-colors hover:border-primary/50 hover:text-foreground"
      >
        <InstagramIcon className="h-3.5 w-3.5" />
        {brand.instagram.handle}
      </a>
    </header>
  )
}
