import { PORTFOLIO } from '../../data/content'

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
              <figure className="mx-auto max-w-[200px]">
                <img
                  src={item.image}
                  alt={`Exemplo de bio — ${item.name}`}
                  className="w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                  width={504}
                  height={1024}
                  loading="lazy"
                />
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
