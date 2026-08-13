import { STEPS } from '../../data/content'

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-base py-16 sm:py-20 lg:py-24">
      <div className="container-site">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight text-text sm:text-[2rem]">
            Como funciona
          </h2>
          <p className="mt-3 text-base text-muted">
            Plataforma ativada e pronta para usar — em até 24h.
          </p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step) => (
            <li key={step.n} className="text-center sm:text-left">
              <span className="font-display text-3xl font-bold text-accent">{step.n}</span>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-text">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.95rem]">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
