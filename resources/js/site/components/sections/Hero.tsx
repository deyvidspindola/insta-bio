import { HERO_BADGES, LINKS } from '../../data/content'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-base pb-16 pt-24 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-[380px] w-[min(92%,560px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_70%)] blur-2xl"
      />

      <div className="container-site relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted">
              <span aria-hidden>⚡</span>
              Ativação em até 24 horas
            </p>

            <h1 className="font-display text-[2.25rem] font-bold leading-[1.1] tracking-tight text-text sm:text-5xl lg:text-[3.15rem]">
              Transforme os seguidores do seu Instagram em{' '}
              <span className="text-accent">clientes no WhatsApp</span>.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
              Tenha uma vitrine digital de altíssimo nível no seu Instagram sem gastar horas
              configurando.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted/90 sm:text-base lg:mx-0">
              Nossa equipe entrega sua plataforma configurada, personalizada e pronta para converter
              seguidores em clientes — em até 24 horas.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href={LINKS.cta}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-base transition-colors hover:bg-accent-hover sm:w-auto"
              >
                Quero ativar minha vitrine
              </a>
            </div>

            <p className="mt-4 text-xs text-muted sm:text-sm">
              Garantia de 7 dias · Sem fidelidade · Domínio próprio ou link customizado
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[320px]">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-accent)_25%,transparent),transparent_70%)] blur-xl"
            />

            <ul className="absolute -left-2 top-8 z-20 flex flex-col gap-2 sm:-left-16 lg:-left-20">
              {HERO_BADGES.slice(0, 2).map((badge) => (
                <li
                  key={badge.label}
                  className="rounded-full border border-line bg-surface/95 px-3 py-1.5 text-[11px] font-medium text-text shadow-lg backdrop-blur-sm sm:text-xs"
                >
                  <span className="mr-1" aria-hidden>
                    {badge.icon}
                  </span>
                  {badge.label}
                </li>
              ))}
            </ul>
            <p className="absolute -right-2 bottom-24 z-20 max-w-[9.5rem] rounded-full border border-line bg-surface/95 px-3 py-1.5 text-[11px] font-medium text-text shadow-lg backdrop-blur-sm sm:-right-14 sm:max-w-none sm:text-xs lg:-right-16">
              <span className="mr-1" aria-hidden>
                {HERO_BADGES[2].icon}
              </span>
              {HERO_BADGES[2].label}
            </p>

            <figure className="relative">
              <img
                src="/images/product-bio-mobile.png"
                alt="Exemplo de vitrine profissional na bio do Instagram"
                className="relative z-10 w-full drop-shadow-[0_28px_56px_rgba(0,0,0,0.55)]"
                width={504}
                height={1024}
                loading="eager"
                fetchPriority="high"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
