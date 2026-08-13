import { LINKS } from '../../data/content'

export function EditorShowcase() {
  return (
    <section id="editor" className="scroll-mt-20 bg-section py-16 sm:py-20 lg:py-24">
      <div className="container-site">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Plataforma</p>
            <h2 className="mt-3 font-display text-[1.75rem] font-bold tracking-tight text-text sm:text-[2rem]">
              Controle total na palma da sua mão
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              Edite textos, substitua fotos ou mude a ordem dos botões em segundos — pelo celular ou
              computador.
            </p>
            <ul className="mt-6 space-y-2.5 text-left text-sm text-muted sm:text-[0.95rem]">
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                Editor visual intuitivo em tempo real
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                Alterações publicadas instantaneamente
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                Domínio próprio (ex: bio.suamarca.com.br) ou link customizado
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                Sem depender de programador ou agência para atualizar
              </li>
            </ul>
            <a
              href={LINKS.cta}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-base transition-colors hover:bg-accent-hover"
            >
              Quero ativar minha vitrine
            </a>
          </div>

          <figure className="relative mx-auto w-full max-w-lg">
            <div
              aria-hidden
              className="absolute -inset-4 rounded-3xl bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-accent)_18%,transparent),transparent_70%)] blur-xl"
            />
            <img
              src="/images/editor-preview-desktop.png"
              alt="Editor da plataforma em uso no computador"
              className="relative z-10 hidden w-full rounded-xl border border-line shadow-[0_24px_48px_rgba(0,0,0,0.45)] md:block"
              width={1200}
              height={750}
              loading="lazy"
            />
            <img
              src="/images/editor-preview-mobile.png"
              alt="Editor da plataforma no celular, com painel de estatísticas da bio"
              className="relative z-10 mx-auto w-full max-w-[260px] drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)] md:hidden"
              width={504}
              height={1024}
              loading="lazy"
            />
          </figure>
        </div>
      </div>
    </section>
  )
}
