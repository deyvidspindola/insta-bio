import { useState } from 'react'
import { PORTFOLIO, type PortfolioItem } from '../../data/content'

/** Mockup de telefone com gradiente — usado quando não há print real. */
function PortfolioPhoneFallback({ item }: { item: PortfolioItem }) {
  return (
    <div
      className="relative mx-auto aspect-[9/19] w-full overflow-hidden rounded-[1.75rem] border border-line bg-base shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
      role="img"
      aria-label={`Prévia ilustrativa — ${item.name} (imagem real pendente)`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-10 h-28 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-accent)_28%,transparent),transparent_70%)] blur-2xl"
      />
      <div className="relative flex h-full flex-col px-3.5 pb-4 pt-8">
        <div className="mx-auto size-11 rounded-2xl bg-surface ring-1 ring-line" />
        <p className="mt-3 truncate text-center text-[11px] font-semibold text-text">{item.name}</p>
        <p className="mt-0.5 line-clamp-2 text-center text-[9px] leading-snug text-muted">
          {item.category}
        </p>

        <div className="mt-5 space-y-2">
          <div className="rounded-2xl bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-accent)_72%,#1a1a1a),color-mix(in_srgb,var(--color-accent)_35%,#0a0a0a))] px-3 py-3">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-white/70">Destaque</p>
            <p className="mt-1 text-[10px] font-semibold text-white">Agende pelo WhatsApp</p>
            <div className="mt-2 h-5 w-20 rounded-full bg-white/90" />
          </div>
          <div className="h-8 rounded-xl border border-line bg-surface/80" />
          <div className="h-8 rounded-xl border border-line bg-surface/80" />
          <div className="grid grid-cols-2 gap-1.5">
            <div className="aspect-square rounded-xl bg-surface ring-1 ring-line" />
            <div className="aspect-square rounded-xl bg-surface ring-1 ring-line" />
          </div>
        </div>

        <p className="mt-auto pt-3 text-center text-[8px] text-muted/70">
          {/*
            TODO(imagem-real): este bloco só aparece quando `item.image` está
            ausente ou falha ao carregar. Para inserir o print real, defina
            `image` em PORTFOLIO (site/src/data/content.ts), ex.:
            image: '/images/portfolio-seu-nicho.png'
          */}
          Imagem do nicho em breve
        </p>
      </div>
    </div>
  )
}

function PortfolioPhone({ item }: { item: PortfolioItem }) {
  const [failed, setFailed] = useState(false)
  const src = item.image?.trim()
  const showImage = Boolean(src) && !failed

  if (!showImage) {
    return <PortfolioPhoneFallback item={item} />
  }

  return (
    <img
      src={src}
      alt={`Exemplo de bio — ${item.name}`}
      className="w-full bg-transparent drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
      width={504}
      height={1024}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export function Clients() {
  return (
    <section id="clientes" className="scroll-mt-20 bg-section py-16 sm:py-20 lg:py-24">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight text-text sm:text-[2rem]">
            Vitrines reais, para nichos diferentes
          </h2>
          <p className="mt-3 text-base text-muted">
            O mesmo sistema visual — adaptado à marca de cada negócio.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-3">
          {PORTFOLIO.map((item) => (
            <li key={item.name} className="text-center">
              <figure className="mx-auto max-w-[200px] bg-transparent">
                <PortfolioPhone item={item} />
              </figure>
              <h3 className="mt-5 font-display text-base font-semibold text-text">{item.name}</h3>
              <p className="mt-1 text-sm text-muted">{item.category}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
