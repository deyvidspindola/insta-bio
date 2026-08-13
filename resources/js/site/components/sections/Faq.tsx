import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQ_ITEMS } from '../../data/content'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-section py-16 sm:py-20">
      <div className="container-site">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-[1.75rem] font-bold tracking-tight text-text sm:text-[2rem]">
            Dúvidas
          </h2>
        </div>

        <div className="mx-auto mt-10 max-w-xl divide-y divide-line border-y border-line">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = open === index
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  <span className="text-[0.95rem] font-semibold text-text">{item.q}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
