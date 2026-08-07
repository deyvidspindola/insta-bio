import { LINKS } from '../../data/content'

export function FinalCta() {
  return (
    <section className="bg-base py-16 sm:py-20">
      <div className="container-site text-center">
        <h2 className="mx-auto max-w-xl font-display text-[1.75rem] font-bold tracking-tight text-text sm:text-[2rem]">
          Ative sua vitrine e comece a converter seguidores em clientes.
        </h2>
        <p className="mt-3 text-sm text-muted sm:text-base">
          Plataforma configurada em até 24 horas · Garantia de 7 dias
        </p>
        <a
          href={LINKS.cta}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-base transition-colors hover:bg-accent-hover"
        >
          Quero ativar minha vitrine
        </a>
      </div>
    </section>
  )
}
