import { COMPARE } from '../../data/content'

export function Compare() {
  return (
    <section className="bg-section py-16 sm:py-20 lg:py-24">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight text-text sm:text-[2rem]">
            Link genérico vs. vitrine exclusiva
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            Cada visita ao perfil pode virar cliente — ou sumir em três segundos.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <p className="text-sm font-semibold text-muted">
              <span className="mr-1.5" aria-hidden>
                ❌
              </span>
              {COMPARE.bad.title}
            </p>
            <ul className="mt-5 space-y-3">
              {COMPARE.bad.items.map((item) => (
                <li key={item} className="text-sm leading-snug text-muted sm:text-[0.95rem]">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-accent/35 bg-surface p-6 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_12%,transparent)] sm:p-7">
            <p className="text-sm font-semibold text-accent">
              <span className="mr-1.5" aria-hidden>
                ✅
              </span>
              {COMPARE.good.title}
            </p>
            <ul className="mt-5 space-y-3">
              {COMPARE.good.items.map((item) => (
                <li key={item} className="text-sm leading-snug text-text/90 sm:text-[0.95rem]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
