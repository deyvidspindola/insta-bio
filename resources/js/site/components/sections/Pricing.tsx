import { ShieldCheck } from 'lucide-react'
import { PLAN } from '../../data/content'

export function Pricing() {
  return (
    <section id="planos" className="scroll-mt-20 bg-base py-16 sm:py-20 lg:py-24">
      <div className="container-site">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight text-text sm:text-[2rem]">
            Planos
          </h2>
          <p className="mt-3 text-base text-muted">
            Ativação inicial + licença da plataforma. Sem fidelidade.
          </p>
        </div>

        <article className="mx-auto mt-10 max-w-lg rounded-3xl border border-accent/30 bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-semibold text-text">{PLAN.name}</h3>
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
              {PLAN.badge}
            </span>
          </div>

          <div className="mt-6 space-y-4 border-y border-line py-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">{PLAN.setupLabel}</p>
              <p className="mt-1 font-display text-4xl font-bold text-text">{PLAN.setup}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">{PLAN.monthlyLabel}</p>
              <p className="mt-1 font-display text-2xl font-bold text-text">
                {PLAN.monthly}
                <span className="text-base font-medium text-muted"> / mês</span>
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {PLAN.features.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-sm text-muted sm:text-[0.95rem]">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-line bg-base/60 px-3.5 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <p className="text-xs leading-relaxed text-muted sm:text-sm">{PLAN.guarantee}</p>
          </div>

          <a
            href={PLAN.ctaHref}
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-base transition-colors hover:bg-accent-hover"
          >
            {PLAN.ctaLabel}
          </a>
        </article>
      </div>
    </section>
  )
}
